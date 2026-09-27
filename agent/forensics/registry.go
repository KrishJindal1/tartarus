//go:build !windows

package forensics

// DumpRegistry is a no-op on non-Windows platforms. The Windows
// implementation lives in registry_windows.go.
func DumpRegistry() []RegistryFinding {
	return nil
}
