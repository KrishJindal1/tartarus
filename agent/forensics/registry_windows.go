//go:build windows

package forensics

import (
	"golang.org/x/sys/windows/registry"
)

// registryRunKeys are the auto-run locations checked for persistence.
var registryRunKeys = []struct {
	hive registry.Key
	path string
	name string
}{
	{registry.LOCAL_MACHINE, `Software\Microsoft\Windows\CurrentVersion\Run`, "HKLM Run"},
	{registry.LOCAL_MACHINE, `Software\Microsoft\Windows\CurrentVersion\RunOnce`, "HKLM RunOnce"},
	{registry.CURRENT_USER, `Software\Microsoft\Windows\CurrentVersion\Run`, "HKCU Run"},
	{registry.LOCAL_MACHINE, `Software\Microsoft\Windows\CurrentVersion\Policies\Explorer\Run`, "HKLM Policies Run"},
}

// DumpRegistry extracts auto-run persistence values from the Windows registry.
func DumpRegistry() []RegistryFinding {
	var out []RegistryFinding
	for _, rk := range registryRunKeys {
		k, err := registry.OpenKey(rk.hive, rk.path, registry.QUERY_VALUE)
		if err != nil {
			continue
		}
		names, err := k.ReadValueNames(-1)
		if err != nil {
			k.Close()
			continue
		}
		for _, n := range names {
			val, _, err := k.GetStringValue(n)
			if err != nil {
				continue
			}
			out = append(out, RegistryFinding{
				Hive:      rk.name,
				KeyPath:   rk.path,
				ValueName: n,
				ValueType: "REG_SZ",
				Data:      val,
			})
		}
		k.Close()
	}
	return out
}
