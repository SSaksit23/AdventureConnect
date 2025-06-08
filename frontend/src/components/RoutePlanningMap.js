import React, { useState, useEffect, useRef } from 'react';
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { toast } from 'react-toastify';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Clock, 
  Trash2, 
  PlusCircle, 
  Loader2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  XCircle, 
  Zap 
} from 'lucide-react';

const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const MapComponent = ({ initialWaypoints, onWaypointsUpdate, tripId }) => {
  const ref = useRef(null);
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isAddingWaypoint, setIsAddingWaypoint] = useState(false);

  // Initialize waypoints from props
  useEffect(() => {
    if (initialWaypoints && initialWaypoints.length > 0) {
      const transformedWaypoints = initialWaypoints.map((component, index) => ({
        id: component.id || `initial-${index}`,
        lat: parseFloat(component.custom_location?.latitude || component.geoCode?.latitude || 0),
        lng: parseFloat(component.custom_location?.longitude || component.geoCode?.longitude || 0),
        name: component.title || component.name || `Waypoint ${index + 1}`,
        type: component.component_type || component.category || 'custom',
        address: component.custom_location?.address || '',
      })).filter(wp => wp.lat && wp.lng);
      setWaypoints(transformedWaypoints);
    } else {
      setWaypoints([]);
    }
  }, [initialWaypoints]);

  // Initialize map
  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 8,
        clickableIcons: false,
      });
      setMap(newMap);
      setDirectionsService(new window.google.maps.DirectionsService());
      const renderer = new window.google.maps.DirectionsRenderer({
        draggable: true,
      });
      renderer.setMap(newMap);
      setDirectionsRenderer(renderer);
    }
  }, [ref, map]);

  // Update markers
  useEffect(() => {
    if (!map) return;

    markers.forEach(marker => marker.setMap(null));
    const newMarkers = [];

    waypoints.forEach((waypoint, index) => {
      if (waypoint.lat && waypoint.lng) {
        const marker = new window.google.maps.Marker({
          position: { lat: waypoint.lat, lng: waypoint.lng },
          map,
          label: `${index + 1}`,
          title: waypoint.name,
        });
        
        const infowindow = new window.google.maps.InfoWindow({
          content: `<b>${waypoint.name}</b><br>${waypoint.address || waypoint.type}`,
        });
        
        marker.addListener("click", () => {
          infowindow.open(map, marker);
        });
        
        newMarkers.push(marker);
      }
    });
    setMarkers(newMarkers);

    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
      map.fitBounds(bounds);
      if (newMarkers.length === 1) {
        map.setZoom(12);
      }
    }
  }, [map, waypoints]);

  // Calculate directions
  useEffect(() => {
    if (!map || !directionsService || !directionsRenderer) return;

    if (waypoints.length < 2) {
      directionsRenderer.setDirections({ routes: [] });
      setRouteInfo(null);
      return;
    }

    const origin = { lat: waypoints[0].lat, lng: waypoints[0].lng };
    const destination = { lat: waypoints[waypoints.length - 1].lat, lng: waypoints[waypoints.length - 1].lng };
    const intermediateWaypoints = waypoints.slice(1, -1).map(wp => ({
      location: { lat: wp.lat, lng: wp.lng },
      stopover: true,
    }));

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        waypoints: intermediateWaypoints,
        optimizeWaypoints: true,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(response);
          const route = response.routes[0];
          let totalDistance = 0;
          let totalDuration = 0;
          route.legs.forEach(leg => {
            totalDistance += leg.distance.value;
            totalDuration += leg.duration.value;
          });
          setRouteInfo({
            distance: (totalDistance / 1000).toFixed(1) + " km",
            duration: (totalDuration / 60).toFixed(0) + " mins",
          });
        } else {
          toast.error("Could not calculate route: " + status);
          setRouteInfo(null);
        }
      }
    );
  }, [map, directionsService, directionsRenderer, waypoints]);

  const handleRemoveWaypoint = (indexToRemove) => {
    const updatedWaypoints = waypoints.filter((_, index) => index !== indexToRemove);
    setWaypoints(updatedWaypoints);
    if (onWaypointsUpdate) {
      onWaypointsUpdate(updatedWaypoints);
    }
  };

  const handleMoveWaypoint = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === waypoints.length - 1)) {
      return;
    }
    const newWaypoints = [...waypoints];
    const [movedItem] = newWaypoints.splice(index, 1);
    newWaypoints.splice(index + direction, 0, movedItem);
    setWaypoints(newWaypoints);
    if (onWaypointsUpdate) {
      onWaypointsUpdate(newWaypoints);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[600px]">
      <div className="w-full md:w-1/3 bg-white p-4 rounded-lg shadow-md overflow-y-auto">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <Navigation className="h-5 w-5 mr-2 text-blue-600" /> 
          Route Planner
        </h3>
        
        {waypoints.length === 0 ? (
          <p className="text-sm text-gray-500">
            No waypoints added yet. Add destinations to your trip to see the route.
          </p>
        ) : (
          <ul className="space-y-2">
            {waypoints.map((wp, index) => (
              <li key={wp.id || index} className="p-2 border rounded-md bg-gray-50 text-sm group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center overflow-hidden">
                    <span className="font-medium mr-2">{index + 1}.</span>
                    <span className="truncate">{wp.name}</span>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                    <button 
                      onClick={() => handleMoveWaypoint(index, -1)} 
                      disabled={index === 0}
                      className="p-1 hover:text-blue-600 disabled:text-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleMoveWaypoint(index, 1)} 
                      disabled={index === waypoints.length - 1}
                      className="p-1 hover:text-blue-600 disabled:text-gray-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleRemoveWaypoint(index)} 
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 ml-6 truncate">{wp.address || wp.type}</p>
              </li>
            ))}
          </ul>
        )}

        {routeInfo && (
          <div className="mt-4 pt-3 border-t">
            <h4 className="font-semibold text-gray-700 mb-2">Route Summary:</h4>
            <p className="text-sm text-gray-600 flex items-center">
              <Navigation className="h-4 w-4 mr-2 text-gray-500" /> 
              Distance: {routeInfo.distance}
            </p>
            <p className="text-sm text-gray-600 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" /> 
              Duration: {routeInfo.duration}
            </p>
          </div>
        )}
      </div>

      <div ref={ref} className="w-full md:w-2/3 h-full rounded-lg shadow-md" />
    </div>
  );
};

const RoutePlanningMap = ({ tripComponents, onWaypointsUpdate, tripId }) => {
  const render = (status) => {
    switch (status) {
      case Status.LOADING:
        return (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="ml-2">Loading Maps...</p>
          </div>
        );
      case Status.FAILURE:
        return (
          <div className="flex justify-center items-center h-full bg-red-50 text-red-700 p-4 rounded-md">
            <AlertCircle className="h-6 w-6 mr-2"/>
            Error loading Google Maps. Please check your API key.
          </div>
        );
      case Status.SUCCESS:
        return (
          <MapComponent 
            initialWaypoints={tripComponents} 
            onWaypointsUpdate={onWaypointsUpdate} 
            tripId={tripId} 
          />
        );
      default:
        return (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="ml-2">Initializing...</p>
          </div>
        );
    }
  };

  return (
    <div className="my-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
        <MapPin className="h-6 w-6 mr-2 text-green-600" />
        Plan Your Route
      </h2>
      {API_KEY ? (
        <Wrapper apiKey={API_KEY} render={render} libraries={['places', 'directions']} />
      ) : (
        <div className="flex justify-center items-center h-[400px] bg-yellow-50 text-yellow-700 p-4 rounded-md border border-yellow-200">
          <AlertCircle className="h-6 w-6 mr-2"/> 
          Google Maps API Key is missing. Please configure REACT_APP_GOOGLE_MAPS_API_KEY.
        </div>
      )}
    </div>
  );
};

export default RoutePlanningMap; 