# Utility & Hospital Navigator App 🏥🚑

A React Native Expo app that helps users find and navigate to nearby utility services including hospitals, pharmacies, police stations, gas stations, banks, and ATMs. Built with TypeScript, NativeWind (Tailwind CSS), and Google Places API.

## Features ✨

### Core Requirements
- **Location Services**: Automatic location detection with permission handling
- **Google Places API Integration**: Find nearby utilities and hospitals
- **Distance Calculation**: Sort results by proximity to user
- **Interactive Map View**: React Native Maps with custom markers
- **Detailed Information**: Full place details with reviews, hours, contact info
- **Navigation Integration**: Direct integration with Google Maps for directions
- **Emergency Quick Access**: Fast access to emergency services

### UI/UX Features
- **Dark/Light Mode**: Automatic theme switching based on system preference
- **Responsive Design**: Optimized for both iOS and Android
- **Pull-to-Refresh**: Update location and results
- **Search Radius Control**: Adjustable search distance
- **Visual Appeal**: Modern card-based design with icons and ratings

### Technical Features
- **Rate Limiting**: Prevents API quota exhaustion
- **Caching**: Reduces redundant API calls
- **Error Handling**: Graceful error management
- **TypeScript**: Full type safety
- **Cross-Platform**: Works on iOS and Android

## Setup Instructions 🚀

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

1. **Clone and Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   - The Google Maps API key is already configured in `.env`
   - API Key: `AIzaSyBUghN90uUO0xf7OKvrh1GczhQgqstvmU8`

3. **Start Development Server**
   ```bash
   npx expo start
   ```

4. **Run on Device/Emulator**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app for physical device testing

## API Configuration 🔧

The app uses Google Places API with the following endpoints:
- **Nearby Search**: Find places within specified radius
- **Place Details**: Get detailed information about specific places
- **Rate Limiting**: 1 second minimum between requests
- **Caching**: 5-minute cache duration to reduce API calls

## App Structure 📁

```
app/
├── index.tsx          # Main screen with place search and list
├── map.tsx           # Interactive map view with markers
├── details.tsx       # Detailed place information
└── _layout.tsx       # Navigation and theme configuration

src/
└── services/
    └── placesService.ts  # Google Places API service with caching

assets/                # App icons and images
```

## Key Features Breakdown 🎯

### Main Screen (`index.tsx`)
- Emergency quick access buttons
- Service type selection (hospitals, pharmacies, etc.)
- Search radius control
- Sorted list of nearby places
- Pull-to-refresh functionality

### Map View (`map.tsx`)
- Interactive map with user location
- Color-coded markers by service type
- Place selection with info cards
- Direct navigation and calling

### Details Screen (`details.tsx`)
- Complete place information
- Star ratings and reviews
- Opening hours
- Contact information
- Emergency actions for hospitals

### Services (`placesService.ts`)
- Rate-limited API calls
- Response caching
- Error handling
- Singleton pattern for efficiency

## Permissions 📱

### iOS
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription`

### Android
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`

## Dark Mode Support 🌙

The app automatically adapts to system theme preferences:
- Dark mode: Gray color scheme with proper contrast
- Light mode: Clean white/gray design
- Dynamic icon and text colors
- Consistent theming across all screens

## Emergency Features 🚨

- Quick access emergency buttons on main screen
- Direct 911 calling for hospitals
- Fast navigation to nearest emergency services
- Emergency action cards in hospital details

## Performance Optimizations ⚡

- **API Rate Limiting**: Prevents quota exhaustion
- **Response Caching**: 5-minute cache reduces redundant calls
- **Lazy Loading**: Services loaded on demand
- **Efficient Sorting**: Client-side distance calculation
- **Memory Management**: Proper cleanup and state management

## Testing 🧪

Test the app on both platforms:
- **iOS**: Use iOS Simulator or physical device
- **Android**: Use Android Emulator or physical device
- **Location**: Test with different locations and permissions
- **Network**: Test offline behavior and error handling

## Deployment 📦

For production deployment:
1. Configure app signing
2. Update app icons and splash screens
3. Test on physical devices
4. Submit to App Store/Play Store

## API Usage Guidelines ⚠️

- The provided API key has usage limits
- Implement proper error handling for quota exceeded
- Consider implementing user authentication for production
- Monitor API usage in Google Cloud Console

## Support 💬

For issues or questions:
- Check Expo documentation
- Review Google Places API documentation
- Test location permissions on physical devices
- Verify API key configuration