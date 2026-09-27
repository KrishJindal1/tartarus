//go:build windows

package byovd

// ScanLoadedDrivers on Windows would enumerate loaded drivers via
// EnumDeviceDrivers (psapi.dll) and hash files from
// C:\Windows\System32\drivers. Detection-only; returns empty until the
// Windows enumeration is implemented (future work).
func ScanLoadedDrivers() []DriverFinding {
	return nil
}
