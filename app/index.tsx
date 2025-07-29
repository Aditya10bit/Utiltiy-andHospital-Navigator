import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Animated, {
  BounceIn,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInLeft,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn
} from 'react-native-reanimated';
const { width } = Dimensions.get('window');

interface PlaceResult {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  opening_hours?: {
    open_now: boolean;
  };
  formatted_phone_number?: string;
}

const PLACE_TYPES = [
  { key: 'hospital', label: 'Hospitals', icon: 'medical' as const },
  { key: 'pharmacy', label: 'Pharmacies', icon: 'medical-outline' as const },
  { key: 'police', label: 'Police Stations', icon: 'shield' as const },
  { key: 'gas_station', label: 'Gas Stations', icon: 'car' as const },
  { key: 'bank', label: 'Banks', icon: 'card' as const },
  { key: 'atm', label: 'ATMs', icon: 'cash' as const },
];

// Animated Dot Component for Loading
const AnimatedDot = ({ delay }: { delay: number }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withDelay(delay, withTiming(1, { duration: 600 })),
        withTiming(0.3, { duration: 600 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View 
      style={[
        {
          width: 8,
          height: 8,
          backgroundColor: '#3B82F6',
          borderRadius: 4,
          marginHorizontal: 4,
        },
        animatedStyle
      ]} 
    />
  );
};

export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState('hospital');
  const [searchRadius, setSearchRadius] = useState('5000');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to find nearby places.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      searchNearbyPlaces(currentLocation, selectedType);
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const searchNearbyPlaces = async (
    userLocation: Location.LocationObject,
    type: string,
    radius: string = searchRadius
  ) => {
    if (!userLocation) return;

    setLoading(true);
    try {
      const { latitude, longitude } = userLocation.coords;
      
      
      const PlacesService = (await import('../src/services/placesService')).default;
      const placesService = PlacesService.getInstance();
      
      const data = await placesService.searchNearbyPlaces(latitude, longitude, type, radius);
      
      if (data.status === 'OK') {
        
        const sortedPlaces = data.results.sort((a: PlaceResult, b: PlaceResult) => {
          const distA = calculateDistance(
            latitude,
            longitude,
            a.geometry.location.lat,
            a.geometry.location.lng
          );
          const distB = calculateDistance(
            latitude,
            longitude,
            b.geometry.location.lat,
            b.geometry.location.lng
          );
          return distA - distB;
        });
        
        setPlaces(sortedPlaces);
      } else {
        Alert.alert('Error', data.error_message || 'Failed to fetch nearby places');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (location) {
      await searchNearbyPlaces(location, selectedType);
    } else {
      await getCurrentLocation();
    }
    setRefreshing(false);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    if (location) {
      searchNearbyPlaces(location, type, searchRadius);
    }
  };

  const handleRadiusChange = (radius: string) => {
    setSearchRadius(radius);
   
  };

  const openInMaps = (place: PlaceResult) => {
    const { lat, lng } = place.geometry.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  const callPlace = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const showPlaceDetails = (place: PlaceResult) => {
    router.push({
      pathname: '/details',
      params: {
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity,
        lat: place.geometry.location.lat.toString(),
        lng: place.geometry.location.lng.toString(),
      }
    });
  };

  const showMapView = () => {
    console.log('showMapView called', { location: !!location, placesCount: places.length });
    if (location && places.length > 0) {
      try {
        console.log('Navigating to map with params:', {
          userLat: location.coords.latitude.toString(),
          userLng: location.coords.longitude.toString(),
          placesCount: places.length,
          type: selectedType,
        });
        
        router.push({
          pathname: '/map' as any,
          params: {
            userLat: location.coords.latitude.toString(),
            userLng: location.coords.longitude.toString(),
            places: JSON.stringify(places),
            type: selectedType,
          }
        });
      } catch (error) {
        console.error('Navigation error:', error);
        Alert.alert('Navigation Error', 'Failed to open map view');
      }
    } else if (!location) {
      Alert.alert('Location Required', 'Please enable location services to view the map.');
    } else {
      Alert.alert('No Results', 'No places found to display on the map.');
    }
  };

  const emergencyCall = (type: 'hospital' | 'police') => {
    const number = type === 'hospital' ? '911' : '03325375777'; 
    Alert.alert(
      'Emergency Call',
      `Call ${number} for ${type === 'hospital' ? 'medical' : 'police'} emergency?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${number}`) }
      ]
    );
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Emergency Quick Access */}
      <Animated.View 
        entering={FadeInDown.delay(100).duration(800).springify()}
        className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
      >
        <Animated.Text 
          entering={FadeIn.delay(200)}
          className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          🚨 Emergency Quick Access
        </Animated.Text>
        <View className="flex-row justify-around">
          <Animated.View entering={SlideInLeft.delay(300).duration(600).springify()}>
            <TouchableOpacity
              onPress={() => emergencyCall('hospital')}
              className="bg-red-500 px-6 py-3 rounded-xl flex-row items-center shadow-lg"
              style={{
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Ionicons name="medical" size={22} color="white" />
              <Text className="text-white font-bold ml-2">Hospital</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View entering={SlideInRight.delay(400).duration(600).springify()}>
            <TouchableOpacity
              onPress={() => emergencyCall('police')}
              className="bg-blue-500 px-6 py-3 rounded-xl flex-row items-center shadow-lg"
              style={{
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Ionicons name="shield" size={22} color="white" />
              <Text className="text-white font-bold ml-2">Police</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Search Controls */}
      <Animated.View 
        entering={FadeInDown.delay(500).duration(800).springify()}
        className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
      >
        <Animated.Text 
          entering={FadeIn.delay(600)}
          className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          🔍 Find Nearby Services
        </Animated.Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {PLACE_TYPES.map((type, index) => (
            <Animated.View
              key={type.key}
              entering={ZoomIn.delay(700 + index * 100).duration(600).springify()}
            >
              <TouchableOpacity
                onPress={() => handleTypeChange(type.key)}
                className={`mr-3 px-4 py-3 rounded-2xl flex-row items-center shadow-sm ${
                  selectedType === type.key
                    ? 'bg-blue-500'
                    : isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}
                style={{
                  shadowColor: selectedType === type.key ? '#3B82F6' : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: selectedType === type.key ? 0.3 : 0.1,
                  shadowRadius: 4,
                  elevation: selectedType === type.key ? 6 : 2,
                }}
              >
                <Ionicons
                  name={type.icon}
                  size={18}
                  color={selectedType === type.key ? 'white' : isDark ? '#9CA3AF' : '#6B7280'}
                />
                <Text
                  className={`ml-2 font-semibold ${
                    selectedType === type.key
                      ? 'text-white'
                      : isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>

        <Animated.View 
          entering={FadeInUp.delay(1000).duration(800).springify()}
          className="flex-row items-center justify-between"
        >
          <View className="flex-1 mr-3">
            <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              📍 Search Radius (meters)
            </Text>
            <TextInput
              value={searchRadius}
              onChangeText={handleRadiusChange}
              onEndEditing={() => {
                if (location && selectedType) {
                  searchNearbyPlaces(location, selectedType, searchRadius);
                }
              }}
              placeholder="5000"
              keyboardType="numeric"
              className={`px-4 py-3 rounded-xl border-2 font-medium ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            />
          </View>
          
          <Animated.View entering={BounceIn.delay(1100).duration(800)}>
            <TouchableOpacity
              onPress={() => {
                if (location && selectedType) {
                  searchNearbyPlaces(location, selectedType, searchRadius);
                }
              }}
              disabled={!location}
              className={`px-4 py-3 rounded-xl mr-2 ${
                location
                  ? 'bg-blue-500'
                  : isDark ? 'bg-gray-700' : 'bg-gray-300'
              }`}
              style={{
                shadowColor: location ? '#3B82F6' : '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: location ? 0.3 : 0.1,
                shadowRadius: 6,
                elevation: location ? 6 : 2,
              }}
            >
              <Ionicons name="refresh" size={22} color="white" />
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View entering={BounceIn.delay(1200).duration(800)}>
            <TouchableOpacity
              onPress={showMapView}
              disabled={!location || places.length === 0}
              className={`px-4 py-3 rounded-xl flex-row items-center ${
                location && places.length > 0
                  ? 'bg-green-500'
                  : isDark ? 'bg-gray-700' : 'bg-gray-300'
              }`}
              style={{
                shadowColor: location && places.length > 0 ? '#10B981' : '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: location && places.length > 0 ? 0.3 : 0.1,
                shadowRadius: 6,
                elevation: location && places.length > 0 ? 6 : 2,
              }}
            >
              <Ionicons name="map" size={22} color="white" />
              <Text className="text-white font-bold ml-1">Map</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Animated.View>

      {/* Results List */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <Animated.View 
            entering={FadeIn.springify()}
            className="flex-1 justify-center items-center py-20"
          >
            <Animated.View entering={ZoomIn.delay(200).duration(600).springify()}>
              <ActivityIndicator size="large" color="#3B82F6" />
            </Animated.View>
            <Animated.Text 
              entering={FadeInUp.delay(400)}
              className={`mt-4 text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
            >
              🔍 Searching nearby places...
            </Animated.Text>
            <Animated.View 
              entering={FadeIn.delay(600)}
              className="mt-4 flex-row items-center"
            >
              <AnimatedDot delay={0} />
              <AnimatedDot delay={200} />
              <AnimatedDot delay={400} />
            </Animated.View>
          </Animated.View>
        ) : places.length === 0 ? (
          <Animated.View 
            entering={FadeIn.springify()}
            className="flex-1 justify-center items-center py-20"
          >
            <Animated.View entering={BounceIn.delay(200).duration(800)}>
              <Ionicons 
                name="location-outline" 
                size={80} 
                color={isDark ? '#6B7280' : '#9CA3AF'} 
              />
            </Animated.View>
            <Animated.Text 
              entering={FadeInUp.delay(400)}
              className={`text-xl font-bold mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
            >
              🔍 No places found
            </Animated.Text>
            <Animated.Text 
              entering={FadeInUp.delay(600)}
              className={`text-center mt-2 px-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            >
              Try adjusting your search radius or ensure location permissions are enabled
            </Animated.Text>
          </Animated.View>
        ) : (
          places.map((place, index) => {
            const distance = location ? calculateDistance(
              location.coords.latitude,
              location.coords.longitude,
              place.geometry.location.lat,
              place.geometry.location.lng
            ) : 0;

            return (
              <Animated.View
                key={place.place_id}
                entering={FadeInDown.delay(1300 + index * 100).duration(600).springify()}
              >
                <TouchableOpacity
                  onPress={() => showPlaceDetails(place)}
                  className={`mx-4 my-2 p-5 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-3">
                          <Text className="text-white font-bold text-sm">{index + 1}</Text>
                        </View>
                        <Text className={`text-lg font-bold flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {place.name}
                        </Text>
                      </View>
                      
                      <Text className={`text-sm mt-1 ml-11 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        📍 {place.vicinity}
                      </Text>
                      <Text className={`text-sm mt-1 ml-11 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        🚗 {distance.toFixed(1)} km away
                      </Text>
                      
                      <View className="flex-row items-center mt-2 ml-11">
                        {place.rating && (
                          <View className="flex-row items-center mr-4">
                            <Ionicons name="star" size={16} color="#FCD34D" />
                            <Text className={`ml-1 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              {place.rating.toFixed(1)}
                            </Text>
                          </View>
                        )}
                        
                        {place.opening_hours && (
                          <View className={`px-2 py-1 rounded-full ${
                            place.opening_hours.open_now 
                              ? 'bg-green-100' 
                              : 'bg-red-100'
                          }`}>
                            <Text className={`text-xs font-semibold ${
                              place.opening_hours.open_now 
                                ? 'text-green-700' 
                                : 'text-red-700'
                            }`}>
                              {place.opening_hours.open_now ? '🟢 Open' : '🔴 Closed'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    <View className="flex-row">
                      <TouchableOpacity
                        onPress={() => openInMaps(place)}
                        className="bg-blue-500 p-3 rounded-xl mr-2"
                        style={{
                          shadowColor: '#3B82F6',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                          elevation: 4,
                        }}
                      >
                        <Ionicons name="navigate" size={20} color="white" />
                      </TouchableOpacity>
                      
                      {place.formatted_phone_number && (
                        <TouchableOpacity
                          onPress={() => callPlace(place.formatted_phone_number!)}
                          className="bg-green-500 p-3 rounded-xl"
                          style={{
                            shadowColor: '#10B981',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 4,
                          }}
                        >
                          <Ionicons name="call" size={20} color="white" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}