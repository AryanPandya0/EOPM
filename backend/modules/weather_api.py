"""
Live Weather API integration (Open-Meteo) for dynamic peak hours and load shifting context.
"""
import requests
from datetime import datetime, timedelta

# Default to New Delhi coordinates
DEFAULT_LAT = 28.6139
DEFAULT_LON = 77.2090

def fetch_live_weather(lat=DEFAULT_LAT, lon=DEFAULT_LON):
    """
    Fetch current and hourly forecast weather from Open-Meteo API.
    Used to determine real grid peak times based on temperature.
    """
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m&timezone=Asia%2FKolkata"
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        current = data.get("current_weather", {})
        hourly = data.get("hourly", {})
        
        # Analyze hourly data to find today's peak temperature hours
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        
        today = datetime.now().strftime("%Y-%m-%d")
        today_indices = [i for i, t in enumerate(times) if t.startswith(today)]
        
        if not today_indices:
            return _fallback_weather()
            
        today_temps = [temps[i] for i in today_indices]
        max_temp = max(today_temps)
        
        # Define dynamic peak hours as hours where temp is within 2 degrees of max temp (Grid load correlates with AC usage)
        # Also include standard evening lighting peak (18:00 - 21:00)
        dynamic_peak_hours = []
        for i in today_indices:
            hour = int(times[i][11:13])
            if temps[i] >= max_temp - 2.0:
                dynamic_peak_hours.append(hour)
                
        # Merge with evening lighting peak
        evening_peak = [18, 19, 20, 21]
        all_peaks = sorted(list(set(dynamic_peak_hours + evening_peak)))
        
        return {
            "current_temp": current.get("temperature"),
            "max_temp_today": max_temp,
            "dynamic_peak_hours": all_peaks,
            "is_live": True,
            "city": "New Delhi (India)"
        }
    except Exception as e:
        print(f"Weather API Error: {e}")
        return _fallback_weather()

def _fallback_weather():
    """Fallback if API fails."""
    return {
        "current_temp": 32.0,
        "max_temp_today": 35.0,
        "dynamic_peak_hours": [10, 11, 12, 13, 14, 15, 18, 19, 20, 21],
        "is_live": False,
        "city": "Default (Fallback)"
    }
