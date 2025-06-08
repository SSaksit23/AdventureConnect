import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { toast } from 'react-toastify';
import { MapPin, Hotel, Utensils, Package, Search, Navigation, Clock, Edit3, Trash2, GripVertical, PlusCircle, Loader2, AlertCircle, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';

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
        id: component.id || `initial-${index}`, // Use component ID or generate one
        lat: parseFloat(component.custom_location?.latitude || component.geoCode?.latitude || 0),
        lng: parseFloat(component.custom_location?.longitude || component.geoCode?.longitude || 0),
        name: component.title || component.name || `Waypoint ${index + 1}`,
        type: component.component_type || component.category || 'custom',
        address: component.custom_location?.address || '',
        originalComponent: component, // Keep original data if needed
      })).filter(wp => wp.lat && wp.lng); // Filter out waypoints without valid coordinates
      setWaypoints(transformedWaypoints);
    } else {
      setWaypoints([]); // Reset if initialWaypoints is empty or null
    }
  }, [initialWaypoints]);

  // Initialize map and services
  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
        zoom: 8,
        clickableIcons: false, // Disable default POI clicks on map
      });
      setMap(newMap);
      setDirectionsService(new window.google.maps.DirectionsService());
      const renderer = new window.google.maps.DirectionsRenderer({
        draggable: true, // Allows dragging the route, which can update waypoints
      });
      renderer.setMap(newMap);
      setDirectionsRenderer(renderer);

      // Listener for route changes if draggable is true
      renderer.addListener('directions_changed', () => {
        const newDirections = renderer.getDirections();
        if (newDirections) {
          // This part is complex: update waypoints based on dragged route
          // For simplicity, we might disable route dragging or handle it carefully
          // console.log("Directions changed by dragging:", newDirections);
          // Potentially update waypoints state and call onWaypointsUpdate
        }
      });
    }
  }, [ref, map]);

  // Update markers when waypoints change
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers = [];

    waypoints.forEach((waypoint, index) => {
      if (waypoint.lat && waypoint.lng) {
        const marker = new window.google.maps.Marker({
          position: { lat: waypoint.lat, lng: waypoint.lng },
          map,
          label: `${index + 1}`, // Label with order
          title: waypoint.name,
          // icon: getMarkerIcon(waypoint.type), // Implement getMarkerIcon
        });
        // Add InfoWindow or other interactions if needed
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

    // Auto-zoom/pan to fit markers
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
      map.fitBounds(bounds);
      if (newMarkers.length === 1) {
        map.setZoom(12); // Zoom in more if only one marker
      }
    }
  }, [map, waypoints]);

  // Calculate and display route when waypoints change
  useEffect(() => {
    if (!map || !directionsService || !directionsRenderer) return;

    if (waypoints.length < 2) {
      directionsRenderer.setDirections({ routes: [] }); // Clear existing route
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
        optimizeWaypoints: true, // Google will attempt to reorder intermediate waypoints for the shortest path
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
            distance: (totalDistance / 1000).toFixed(1) + " km", // meters to km
            duration: (totalDuration / 60).toFixed(0) + " mins", // seconds to mins
            legs: route.legs,
          });
          // If optimizeWaypoints reordered, update local waypoints state
          const optimizedOrder = response.routes[0].waypoint_order;
          if (optimizedOrder && optimizedOrder.length > 0 && intermediateWaypoints.length > 0) {
            const reorderedWaypoints = [
              waypoints[0],
              ...optimizedOrder.map(i => waypoints[i + 1]), // +1 because waypoints[0] is origin
              waypoints[waypoints.length - 1]
            ];
            // Check if order actually changed to prevent infinite loop
            if (JSON.stringify(reorderedWaypoints.map(wp => wp.id)) !== JSON.stringify(waypoints.map(wp => wp.id))) {
              setWaypoints(reorderedWaypoints);
              if (onWaypointsUpdate) {
                onWaypointsUpdate(reorderedWaypoints);
              }
            }
          }
        } else {
          toast.error("Directions request failed due to " + status);
          setRouteInfo(null);
        }
      }
    );
  }, [map, directionsService, directionsRenderer, waypoints, onWaypointsUpdate]);

  // Handle map click to add custom waypoint
  useEffect(() => {
    if (!map || !isAddingWaypoint) return;

    const clickListener = map.addListener("click", (mapsMouseEvent) => {
      const latLng = mapsMouseEvent.latLng;
      const name = prompt("Enter waypoint name:", `Custom Waypoint ${waypoints.length + 1}`);
      if (name) {
        const newWaypoint = {
          id: `custom-${Date.now()}`,
          lat: latLng.lat(),
          lng: latLng.lng(),
          name: name,
          type: 'custom',
        };
        const updatedWaypoints = [...waypoints, newWaypoint];
        setWaypoints(updatedWaypoints);
        if (onWaypointsUpdate) {
          onWaypointsUpdate(updatedWaypoints);
        }
      }
      setIsAddingWaypoint(false); // Disable after one click
    });

    return () => {
      window.google.maps.event.removeListener(clickListener);
    };
  }, [map, isAddingWaypoint, waypoints, onWaypointsUpdate]);

  const handleToggleAddWaypointMode = () => {
    setIsAddingWaypoint(prev => !prev);
    if (!isAddingWaypoint) {
      toast.info("Click on the map to add a custom waypoint.");
    } else {
      toast.info("Add waypoint mode disabled.");
    }
  };

  const handleRemoveWaypoint = (indexToRemove) => {
    const updatedWaypoints = waypoints.filter((_, index) => index !== indexToRemove);
    setWaypoints(updatedWaypoints);
    if (onWaypointsUpdate) {
      onWaypointsUpdate(updatedWaypoints);
    }
  };

  const handleMoveWaypoint = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === waypoints.length - 1)) {
      return; // Cannot move first up or last down
    }
    const newWaypoints = [...waypoints];
    const [movedItem] = newWaypoints.splice(index, 1);
    newWaypoints.splice(index + direction, 0, movedItem);
    setWaypoints(newWaypoints);
    if (onWaypointsUpdate) {
      onWaypointsUpdate(newWaypoints);
    }
  };

  const getMarkerIcon = (type) => {
    // Placeholder - customize icons based on type
    let color = "blue";
    if (type === 'hotel' || type === 'accommodation') color = "red"; // Use 'accommodation' as per trip_component type
    else if (type === 'activity') color = "green";
    else if (type === 'poi' || type === 'other') color = "purple"; // 'other' can be used for POIs from Amadeus
    
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 0,
      scale: 8,
    };
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[600px] md:h-[700px]">
      {/* Sidebar */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white p-4 rounded-lg shadow-md overflow-y-auto">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <Navigation className="h-5 w-5 mr-2 text-blue-600" /> Route Planner
        </h3>
        <button
          onClick={handleToggleAddWaypointMode}
          className={`w-full mb-3 px-3 py-2 text-sm rounded-md flex items-center justify-center transition-colors
            ${isAddingWaypoint ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
        >
          {isAddingWaypoint ? <XCircle className="h-4 w-4 mr-1.5" /> : <PlusCircle className="h-4 w-4 mr-1.5" />}
          {isAddingWaypoint ? 'Cancel Add Waypoint' : 'Add Custom Waypoint'}
        </button>
        
        {waypoints.length === 0 ? (
          <p className="text-sm text-gray-500">No waypoints added yet. Add components to your trip or click 'Add Custom Waypoint' and then click on the map.</p>
        ) : (
          <ul className="space-y-2">
            {waypoints.map((wp, index) => (
              <li key={wp.id || index} className="p-2.5 border rounded-md bg-gray-50 hover:bg-gray-100 text-sm group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center overflow-hidden">
                    <GripVertical className="h-4 w-4 mr-1.5 text-gray-400 cursor-grab group-hover:text-gray-600" /> {/* Placeholder for D&D */}
                    <span className="font-medium mr-1.5">{index + 1}.</span>
                    <span className="truncate" title={wp.name}>{wp.name}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleMoveWaypoint(index, -1)} disabled={index === 0} className="p-1 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleMoveWaypoint(index, 1)} disabled={index === waypoints.length - 1} className="p-1 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleRemoveWaypoint(index)} className="p-1 text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 ml-5 truncate">{wp.address || wp.type}</p>
              </li>
            ))}
          </ul>
        )}

        {routeInfo && (
          <div className="mt-4 pt-3 border-t">
            <h4 className="font-semibold text-gray-700 mb-1.5">Route Summary:</h4>
            <p className="text-sm text-gray-600 flex items-center">
              <Navigation className="h-4 w-4 mr-1.5 text-gray-500" /> Distance: {routeInfo.distance}
            </p>
            <p className="text-sm text-gray-600 flex items-center">
              <Clock className="h-4 w-4 mr-1.5 text-gray-500" /> Duration: {routeInfo.duration}
            </p>
            {/* Optionally display turn-by-turn directions from routeInfo.legs */}
          </div>
        )}
      </div>

      {/* Map Area */}
      <div ref={ref} className="w-full md:w-2/3 lg:w-3/4 h-full rounded-lg shadow-md" />
    </div>
  );
};

const RoutePlanningMap = ({ tripComponents, onWaypointsUpdate, tripId }) => {
  const render = (status) => {
    switch (status) {
      case Status.LOADING:
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /><p className="ml-2">Loading Maps...</p></div>;
      case Status.FAILURE:
        return <div className="flex justify-center items-center h-full bg-red-50 text-red-700 p-4 rounded-md"><AlertCircle className="h-6 w-6 mr-2"/>Error loading Google Maps. Please check your API key and internet connection.</div>;
      case Status.SUCCESS:
        return <MapComponent initialWaypoints={tripComponents} onWaypointsUpdate={onWaypointsUpdate} tripId={tripId} />;
      default:
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /><p className="ml-2">Initializing...</p></div>;
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
            <AlertCircle className="h-6 w-6 mr-2"/> Google Maps API Key is missing. Please configure REACT_APP_GOOGLE_MAPS_API_KEY.
        </div>
      )}
    </div>
  );
};

export default RoutePlanningMap;
