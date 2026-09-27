package byovd

import "testing"

func TestScanLoadedDrivers(t *testing.T) {
	findings := ScanLoadedDrivers()
	t.Logf("BYOVD findings: %d", len(findings))
	// detection-only scan must never error; findings depend on host modules
	for _, f := range findings {
		if f.Name == "" || f.Severity == "" {
			t.Fatalf("incomplete finding: %+v", f)
		}
	}
}

func TestKnownDriverIntel(t *testing.T) {
	if _, ok := lookupDriverIntel("dbutil_2_3.sys"); !ok {
		t.Fatal("expected intel for dbutil_2_3.sys")
	}
	if _, ok := lookupDriverIntel("definitely_not_a_driver.sys"); ok {
		t.Fatal("unexpected match")
	}
}

func TestCallbackNullifierDisabled(t *testing.T) {
	rep, err := CallbackNullifier("dbutil_2_3.sys")
	if err != nil {
		t.Fatal(err)
	}
	if rep["nullification"] != "disabled" {
		t.Fatalf("expected disabled, got %v", rep["nullification"])
	}
	if rep["detected"] != true {
		t.Fatalf("expected detection of known driver")
	}
	if _, err := CallbackNullifier(""); err == nil {
		t.Fatal("expected error for empty name")
	}
}
