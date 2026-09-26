import platform
import socket


def system_info():
    return {
        "hostname": socket.gethostname(),
        "os": platform.system(),
        "architecture": platform.machine(),
    }