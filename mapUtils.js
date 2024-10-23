export const DEFAULT_COORDINATES = {
    latitude: 59.3293,
    longitude: 18.0686,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

export const calculateRegion = (coordinates, defaultRegion) => {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      return defaultRegion;
    }
  
    const latitudes = coordinates.map(coord => coord.latitude);
    const longitudes = coordinates.map(coord => coord.longitude);
  
    const latitudeDelta = Math.max(...latitudes) - Math.min(...latitudes) + 0.1;
    const longitudeDelta = Math.max(...longitudes) - Math.min(...longitudes) + 0.1;
  
    const centerLatitude = (Math.max(...latitudes) + Math.min(...latitudes)) / 2;
    const centerLongitude = (Math.max(...longitudes) + Math.min(...longitudes)) / 2;
  
    return {
      latitude: centerLatitude,
      longitude: centerLongitude,
      latitudeDelta,
      longitudeDelta,
    };
  };

  export const getDistanceToSegment = (point, start, end) => {
    const x0 = point.latitude;
    const y0 = point.longitude;
    const x1 = start.latitude;
    const y1 = start.longitude;
    const x2 = end.latitude;
    const y2 = end.longitude;

    const A = x0 - x1;
    const B = y0 - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq !== 0 ? dot / lenSq : -1;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = x0 - xx;
    const dy = y0 - yy;
    return Math.sqrt(dx * dx + dy * dy);
};

export const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year}, ${hours}:${minutes}`;
};
  