# Temporary CORS Solutions for Testing

## Option 1: Use Local Backend

```env
REACT_APP_API_URL=http://127.0.0.1:8000/api
```

## Option 2: Use CORS Proxy (Temporary Only)

```env
REACT_APP_API_URL=https://cors-anywhere.herokuapp.com/https://backend.vembarkarupatti.in/api
```

## Option 3: Use AllOrigins Proxy

```env
REACT_APP_API_URL=https://api.allorigins.win/raw?url=https://backend.vembarkarupatti.in/api
```

## Option 4: Mock Backend for Development

If no backend is available, use mock API responses.

## Notes:

- Option 1 is best for development
- Options 2-3 are temporary workarounds only
- For production, backend CORS must be properly configured
