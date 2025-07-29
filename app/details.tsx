import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export default function DetailsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const placeId = params.placeId as string;
  const name = params.name as string;
  const address = params.address as string;
  const lat = parseFloat(params.lat as string);
  const lng = parseFloat(params.lng as string);

  useEffect(() => {
    fetchPlaceDetails();
  }, []);

  const fetchPlaceDetails = async () => {
    try {
      
      const PlacesService = (await import('../src/services/placesService')).default;
      const placesService = PlacesService.getInstance();
      
      const data = await placesService.getPlaceDetails(placeId);
      
      if (data.status === 'OK') {
        setPlaceDetails(data.result);
      } else {
        Alert.alert('Error', data.error_message || 'Failed to fetch place details');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  const callPlace = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const openWebsite = (website: string) => {
    Linking.openURL(website);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={16} color="#FCD34D" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={16} color="#FCD34D" />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#FCD34D" />
      );
    }
    
    return stars;
  };

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Loading details...
        </Text>
      </View>
    );
  }

  const details = placeDetails || {
    name,
    formatted_address: address,
    geometry: { location: { lat, lng } },
    types: [],
    formatted_phone_number: undefined,
    website: undefined,
    rating: undefined,
    user_ratings_total: undefined,
    opening_hours: undefined,
    photos: undefined,
    reviews: undefined,
  };

  return (
    <ScrollView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {details.name}
        </Text>
        <Text className={`text-base mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {details.formatted_address}
        </Text>
        
        {details.rating && (
          <View className="flex-row items-center mt-3">
            <View className="flex-row">
              {renderStars(details.rating)}
            </View>
            <Text className={`ml-2 text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {details.rating.toFixed(1)}
            </Text>
            {details.user_ratings_total && (
              <Text className={`ml-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                ({details.user_ratings_total} reviews)
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} mt-2`}>
        <View className="flex-row justify-around">
          <TouchableOpacity
            onPress={openInMaps}
            className="bg-blue-500 px-6 py-3 rounded-lg flex-row items-center"
          >
            <Ionicons name="navigate" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Navigate</Text>
          </TouchableOpacity>
          
          {details.formatted_phone_number && (
            <TouchableOpacity
              onPress={() => callPlace(details.formatted_phone_number!)}
              className="bg-green-500 px-6 py-3 rounded-lg flex-row items-center"
            >
              <Ionicons name="call" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Call</Text>
            </TouchableOpacity>
          )}
          
          {details.website && (
            <TouchableOpacity
              onPress={() => openWebsite(details.website!)}
              className="bg-purple-500 px-6 py-3 rounded-lg flex-row items-center"
            >
              <Ionicons name="globe" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Website</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contact Information */}
      <View className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} mt-2`}>
        <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Contact Information
        </Text>
        
        {details.formatted_phone_number && (
          <View className="flex-row items-center mb-2">
            <Ionicons name="call" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text className={`ml-3 text-base ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {details.formatted_phone_number}
            </Text>
          </View>
        )}
        
        {details.website && (
          <View className="flex-row items-center mb-2">
            <Ionicons name="globe" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text className={`ml-3 text-base ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {details.website}
            </Text>
          </View>
        )}
        
        <View className="flex-row items-center">
          <Ionicons name="location" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <Text className={`ml-3 text-base ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {details.formatted_address}
          </Text>
        </View>
      </View>

      {/* Opening Hours */}
      {details.opening_hours && (
        <View className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} mt-2`}>
          <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Opening Hours
          </Text>
          
          <View className="flex-row items-center mb-3">
            <Ionicons 
              name={details.opening_hours.open_now ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={details.opening_hours.open_now ? "#10B981" : "#EF4444"} 
            />
            <Text className={`ml-2 text-base font-medium ${
              details.opening_hours.open_now ? 'text-green-500' : 'text-red-500'
            }`}>
              {details.opening_hours.open_now ? 'Open Now' : 'Closed'}
            </Text>
          </View>
          
          {details.opening_hours.weekday_text && (
            <View>
              {details.opening_hours.weekday_text.map((day, index) => (
                <Text key={index} className={`text-base mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {day}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Reviews */}
      {details.reviews && details.reviews.length > 0 && (
        <View className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} mt-2`}>
          <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Recent Reviews
          </Text>
          
          {details.reviews.slice(0, 3).map((review, index) => (
            <View key={index} className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <View className="flex-row items-center justify-between mb-2">
                <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {review.author_name}
                </Text>
                <View className="flex-row">
                  {renderStars(review.rating)}
                </View>
              </View>
              <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {review.text}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Emergency Actions for Hospitals */}
      {/* {details.types.includes('hospital') && (
        <View className={`p-4 ${isDark ? 'bg-red-900' : 'bg-red-50'} mt-2 border ${isDark ? 'border-red-800' : 'border-red-200'}`}>
          <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-red-200' : 'text-red-800'}`}>
            Emergency Actions
          </Text>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Emergency Call',
                'Call 911 for medical emergency?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Call', onPress: () => Linking.openURL('tel:911') }
                ]
              );
            }}
            className="bg-red-500 px-4 py-3 rounded-lg flex-row items-center justify-center"
          >
            <Ionicons name="medical" size={20} color="white" />
            <Text className="text-white font-bold ml-2">Emergency Call 911</Text>
          </TouchableOpacity>
        </View>
      )} */}
    </ScrollView>
  );
}