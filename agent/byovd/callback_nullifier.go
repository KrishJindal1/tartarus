package byovd

import "errors"

// CallbackNullifier reports what a BYOVD callback-nullification run would do.
//
// This agent deliberately does NOT implement the callback-nullification
// exploit technique itself (writing to a vulnerable driver's kernel memory to
// blind EDR/user-mode hook callbacks). That is an offensive action against
// third-party security products and is out of scope for a forensic
// collection tool.
//
// What this build does instead:
//   - ScanLoadedDrivers() detects vulnerable drivers and reports them so the
//     response team can revoke/block them (SRP/AppLocker, HVCI, driver block
//     list).
//
// CallbackNullifier returns a structured report explaining that the
// capability is disabled and what was detected instead.
func CallbackNullifier(driverName string) (map[string]any, error) {
	if driverName == "" {
		return nil, errors.New("driver name required")
	}
	detected := false
	if _, ok := knownVulnerableDrivers[driverName]; ok {
		detected = true
	}
	return map[string]any{
		"driver":             driverName,
		"detected":           detected,
		"nullification":      "disabled",
		"reason":             "forensic agent does not modify kernel callbacks; detection + remediation only",
		"recommended_action": "block driver load via vulnerable driver blocklist / remove module",
	}, nil
}
