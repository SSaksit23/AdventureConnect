import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  MapPin, 
  Clock, 
  Star, 
  Navigation, 
  Zap, 
  Calendar, 
  Loader2, 
  Brain, 
  Route, 
  Car, 
  Plane,
  Bus,
  Search,
  Plus,
  Trash2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const API_KEY = 'AIzaSyC8thfcniP-SWuADDMKaRKwG_4chz01E8k';

const IntelligentRoutePlanner = ({ tripData, updateTripData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [attractions, setAttractions] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [routeAnalysis, setRouteAnalysis] = useState(null);
  const [selectedAttractions, setSelectedAttractions] = useState([]);
  const [travelMode, setTravelMode] = useState('DRIVING');
  const [showDetails, setShowDetails] = useState(false);
  const [planningStep, setPlanningStep] = useState('input');

  // Initialize Google Maps Services
  const [placesService, setPlacesService] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [distanceMatrixService, setDistanceMatrixService] = useState(null);

  useEffect(() => {
    if (window.google && window.google.maps) {
      const dummyMap = new window.google.maps.Map(document.createElement('div'));
      setPlacesService(new window.google.maps.places.PlacesService(dummyMap));
      setDirectionsService(new window.google.maps.DirectionsService());
      setDistanceMatrixService(new window.google.maps.DistanceMatrixService());
    }
  }, []);

  // Find Attractions using Places API
  const findAttractions = async (destination) => {
    if (!placesService) return [];

    return new Promise((resolve) => {
      const request = {
        query: `attractions ${destination}`,
        fields: ['name', 'formatted_address', 'geometry', 'place_id', 'rating', 'user_ratings_total', 'opening_hours', 'photos', 'price_level', 'types']
      };

      placesService.textSearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          const processedResults = results.slice(0, 20).map(place => ({
            id: place.place_id,
            name: place.name,
            address: place.formatted_address,
            location: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            },
            rating: place.rating || 0,
            ratingsCount: place.user_ratings_total || 0,
            priceLevel: place.price_level || 0,
            types: place.types || [],
            openingHours: place.opening_hours ? {
              isOpen: place.opening_hours.isOpen?.() || false,
              weekdayText: place.opening_hours.weekday_text || []
            } : null,
            photos: place.photos ? place.photos.slice(0, 1).map(photo => 
              photo.getUrl({ maxWidth: 300, maxHeight: 200 })
            ) : []
          }));
          resolve(processedResults);
        } else {
          console.error('Places API error:', status);
          resolve([]);
        }
      });
    });
  };

  // Calculate Distance Matrix for optimization
  const calculateDistanceMatrix = async (locations) => {
    if (!distanceMatrixService || locations.length < 2) return null;

    const origins = locations.map(loc => new window.google.maps.LatLng(loc.lat, loc.lng));
    const destinations = [...origins];

    return new Promise((resolve) => {
      distanceMatrixService.getDistanceMatrix({
        origins: origins,
        destinations: destinations,
        travelMode: window.google.maps.TravelMode[travelMode],
        avoidHighways: false,
        avoidTolls: false
      }, (response, status) => {
        if (status === window.google.maps.DistanceMatrixStatus.OK) {
          resolve(response);
        } else {
          console.error('Distance Matrix API error:', status);
          resolve(null);
        }
      });
    });
  };

  // Optimize Route using simple TSP heuristic
  const optimizeRoute = (attractions, distanceMatrix) => {
    if (!distanceMatrix || attractions.length < 2) return attractions;

    const n = attractions.length;
    const distances = [];
    
    // Build distance matrix
    for (let i = 0; i < n; i++) {
      distances[i] = [];
      for (let j = 0; j < n; j++) {
        const element = distanceMatrix.rows[i].elements[j];
        if (element.status === 'OK') {
          distances[i][j] = element.duration.value;
        } else {
          distances[i][j] = Infinity;
        }
      }
    }

    // Simple nearest neighbor algorithm
    const visited = new Array(n).fill(false);
    const route = [0];
    visited[0] = true;
    let currentPos = 0;

    for (let step = 1; step < n; step++) {
      let nearestDist = Infinity;
      let nearestIndex = -1;

      for (let i = 0; i < n; i++) {
        if (!visited[i] && distances[currentPos][i] < nearestDist) {
          nearestDist = distances[currentPos][i];
          nearestIndex = i;
        }
      }

      if (nearestIndex !== -1) {
        route.push(nearestIndex);
        visited[nearestIndex] = true;
        currentPos = nearestIndex;
      }
    }

    return route.map(index => attractions[index]);
  };

  // Get detailed directions
  const calculateDetailedDirections = async (optimizedAttractions) => {
    if (!directionsService || optimizedAttractions.length < 2) return null;

    const origin = optimizedAttractions[0].location;
    const destination = optimizedAttractions[optimizedAttractions.length - 1].location;
    const waypoints = optimizedAttractions.slice(1, -1).map(attraction => ({
      location: new window.google.maps.LatLng(attraction.location.lat, attraction.location.lng),
      stopover: true
    }));

    return new Promise((resolve) => {
      directionsService.route({
        origin: new window.google.maps.LatLng(origin.lat, origin.lng),
        destination: new window.google.maps.LatLng(destination.lat, destination.lng),
        waypoints: waypoints,
        travelMode: window.google.maps.TravelMode[travelMode],
        optimizeWaypoints: false
      }, (response, status) => {
        if (status === 'OK') {
          resolve(response);
        } else {
          console.error('Directions API error:', status);
          resolve(null);
        }
      });
    });
  };

  // Generate Intelligent Route
  const generateIntelligentRoute = async () => {
    if (!tripData.destinations) {
      toast.error('Please add destinations first');
      return;
    }

    setIsLoading(true);
    setPlanningStep('search');

    try {
      const destinations = tripData.destinations.split(',').map(d => d.trim());
      const allAttractions = [];

      for (const destination of destinations) {
        toast.info(`Finding attractions in ${destination}...`);
        const destAttractions = await findAttractions(destination);
        allAttractions.push(...destAttractions.slice(0, 10));
      }

      setAttractions(allAttractions);
      toast.success(`Found ${allAttractions.length} attractions`);

      const topAttractions = allAttractions
        .filter(attr => attr.rating >= 4.0)
        .slice(0, Math.min(8, allAttractions.length));
      
      setSelectedAttractions(topAttractions);
      setPlanningStep('optimize');

      if (topAttractions.length >= 2) {
        await optimizeSelectedRoute(topAttractions);
      }

    } catch (error) {
      console.error('Error generating intelligent route:', error);
      toast.error('Failed to generate route. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Optimize Selected Route
  const optimizeSelectedRoute = async (attractionsToOptimize = selectedAttractions) => {
    if (attractionsToOptimize.length < 2) {
      toast.error('Please select at least 2 attractions');
      return;
    }

    setIsLoading(true);
    toast.info('Optimizing your route...');

    try {
      // Get distance matrix
      const locations = attractionsToOptimize.map(attr => attr.location);
      const distanceMatrix = await calculateDistanceMatrix(locations);

      if (distanceMatrix) {
        // Optimize route order
        const optimized = optimizeRoute(attractionsToOptimize, distanceMatrix);
        setOptimizedRoute(optimized);

        // Get detailed directions
        const directions = await calculateDetailedDirections(optimized);
        
        if (directions) {
          const route = directions.routes[0];
          let totalDistance = 0;
          let totalDuration = 0;

          route.legs.forEach(leg => {
            totalDistance += leg.distance.value;
            totalDuration += leg.duration.value;
          });

          setRouteAnalysis({
            totalDistance: (totalDistance / 1000).toFixed(1) + ' km',
            totalDuration: Math.round(totalDuration / 60) + ' minutes',
            estimatedCost: calculateEstimatedCost(totalDistance, travelMode),
            attractionsCount: optimized.length,
            legs: route.legs.map((leg, index) => ({
              from: optimized[index].name,
              to: optimized[index + 1].name,
              distance: leg.distance.text,
              duration: leg.duration.text
            }))
          });

          setPlanningStep('review');
          toast.success('Route optimized successfully!');

          // Update trip data
          updateTripData({
            routePlanning: {
              ...tripData.routePlanning,
              intelligentRoute: {
                attractions: optimized,
                analysis: routeAnalysis,
                travelMode: travelMode,
                lastUpdated: new Date().toISOString()
              }
            }
          });
        }
      } else {
        // Fallback to simple optimization
        setOptimizedRoute(attractionsToOptimize);
        const totalDistance = attractionsToOptimize.length * 15;
        const totalDuration = attractionsToOptimize.length * 30;

        setRouteAnalysis({
          totalDistance: totalDistance.toFixed(1) + ' km',
          totalDuration: totalDuration + ' minutes',
          estimatedCost: `$${(totalDistance * 0.15).toFixed(2)}`,
          attractionsCount: attractionsToOptimize.length
        });

        setPlanningStep('review');
        toast.success('Route created with estimated distances!');
      }

    } catch (error) {
      console.error('Error optimizing route:', error);
      toast.error('Failed to optimize route');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate estimated cost
  const calculateEstimatedCost = (distanceMeters, mode) => {
    const distanceKm = distanceMeters / 1000;
    const costs = {
      'DRIVING': distanceKm * 0.15,
      'TRANSIT': distanceKm * 0.05,
      'WALKING': 0
    };
    return costs[mode] ? `$${costs[mode].toFixed(2)}` : 'N/A';
  };

  const toggleAttractionSelection = (attraction) => {
    const isSelected = selectedAttractions.some(a => a.id === attraction.id);
    if (isSelected) {
      setSelectedAttractions(prev => prev.filter(a => a.id !== attraction.id));
    } else {
      setSelectedAttractions(prev => [...prev, attraction]);
    }
  };

  const getTravelModeIcon = (mode) => {
    switch (mode) {
      case 'DRIVING': return <Car className="h-4 w-4" />;
      case 'TRANSIT': return <Bus className="h-4 w-4" />;
      case 'WALKING': return <Navigation className="h-4 w-4" />;
      default: return <Car className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center">
          <Brain className="h-6 w-6 mr-2 text-purple-600" />
          Intelligent Route Planner
        </h3>
        <div className="flex items-center space-x-2">
          <select
            value={travelMode}
            onChange={(e) => setTravelMode(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="DRIVING">🚗 Driving</option>
            <option value="TRANSIT">🚌 Public Transit</option>
            <option value="WALKING">🚶 Walking</option>
          </select>
        </div>
      </div>

      {/* Planning Steps Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className={`flex items-center ${planningStep === 'input' ? 'text-blue-600 font-medium' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
              planningStep === 'input' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>1</div>
            Input
          </span>
          <ArrowRight className="h-4 w-4" />
          <span className={`flex items-center ${planningStep === 'search' ? 'text-blue-600 font-medium' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
              planningStep === 'search' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>2</div>
            Search
          </span>
          <ArrowRight className="h-4 w-4" />
          <span className={`flex items-center ${planningStep === 'optimize' ? 'text-blue-600 font-medium' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
              planningStep === 'optimize' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>3</div>
            Optimize
          </span>
          <ArrowRight className="h-4 w-4" />
          <span className={`flex items-center ${planningStep === 'review' ? 'text-green-600 font-medium' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
              planningStep === 'review' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}>4</div>
            Review
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={generateIntelligentRoute}
          disabled={isLoading || !tripData.destinations}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
          Generate AI Route
        </button>
        
        {selectedAttractions.length > 1 && (
          <button
            onClick={() => optimizeSelectedRoute()}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Route className="h-4 w-4 mr-2" />
            Optimize Selected ({selectedAttractions.length})
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">
            {planningStep === 'search' && 'Finding the best attractions...'}
            {planningStep === 'optimize' && 'Optimizing your route...'}
          </p>
        </div>
      )}

      {/* Attractions Grid */}
      {attractions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Found Attractions ({attractions.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {attractions.map((attraction) => {
              const isSelected = selectedAttractions.some(a => a.id === attraction.id);
              return (
                <div
                  key={attraction.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleAttractionSelection(attraction)}
                >
                  {attraction.photos.length > 0 && (
                    <img
                      src={attraction.photos[0]}
                      alt={attraction.name}
                      className="w-full h-32 object-cover rounded-md mb-2"
                    />
                  )}
                  <h5 className="font-medium text-sm mb-1">{attraction.name}</h5>
                  <div className="flex items-center text-xs text-gray-600 mb-2">
                    <Star className="h-3 w-3 text-yellow-400 mr-1" />
                    {attraction.rating.toFixed(1)} ({attraction.ratingsCount})
                  </div>
                  <p className="text-xs text-gray-500 truncate mb-2">{attraction.address}</p>
                  {attraction.openingHours && (
                    <div className="flex items-center text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      <span className={attraction.openingHours.isOpen ? 'text-green-600' : 'text-red-600'}>
                        {attraction.openingHours.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  )}
                  {isSelected && (
                    <div className="mt-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Optimized Route */}
      {optimizedRoute.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <Route className="h-5 w-5 mr-2 text-green-600" />
            Optimized Route
          </h4>
          <div className="space-y-3">
            {optimizedRoute.map((attraction, index) => (
              <div key={attraction.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h6 className="font-medium">{attraction.name}</h6>
                  <p className="text-sm text-gray-600">{attraction.address}</p>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <Star className="h-3 w-3 text-yellow-400 mr-1" />
                    {attraction.rating.toFixed(1)}
                    {attraction.openingHours && (
                      <>
                        <span className="mx-2">•</span>
                        <Clock className="h-3 w-3 mr-1" />
                        <span className={attraction.openingHours.isOpen ? 'text-green-600' : 'text-red-600'}>
                          {attraction.openingHours.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {index < optimizedRoute.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Route Analysis */}
      {routeAnalysis && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold mb-4 flex items-center text-green-800">
            <CheckCircle className="h-5 w-5 mr-2" />
            Route Analysis
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{routeAnalysis.totalDistance}</div>
              <div className="text-sm text-green-600">Total Distance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{routeAnalysis.totalDuration}</div>
              <div className="text-sm text-green-600">Travel Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{routeAnalysis.estimatedCost}</div>
              <div className="text-sm text-green-600">Estimated Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700 flex items-center justify-center">
                {getTravelModeIcon(travelMode)}
              </div>
              <div className="text-sm text-green-600">{travelMode.toLowerCase()}</div>
            </div>
          </div>

          {/* Detailed Route Steps */}
          {routeAnalysis.legs && (
            <div className="mt-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center text-sm text-green-700 hover:text-green-800"
              >
                {showDetails ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                Show Route Details
              </button>
              
              {showDetails && (
                <div className="mt-3 space-y-2">
                  {routeAnalysis.legs.map((leg, index) => (
                    <div key={index} className="bg-white border border-green-200 rounded p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{leg.from} → {leg.to}</span>
                        <span className="text-xs text-gray-600">{leg.distance} • {leg.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Travel Mode Recommendations */}
      {planningStep === 'review' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-semibold text-blue-800 mb-2">💡 Travel Recommendations</h5>
          <div className="text-sm text-blue-700 space-y-1">
            <p>🚗 <strong>Driving:</strong> Most flexible, park at each location</p>
            <p>🚌 <strong>Public Transit:</strong> Most economical, consider day passes</p>
            <p>✈️ <strong>Flights:</strong> For long distances, check <a href="https://www.google.com/flights" target="_blank" rel="noopener noreferrer" className="underline">Google Flights</a></p>
            <p>🚂 <strong>Train:</strong> Comfortable for medium distances, scenic routes</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentRoutePlanner; 