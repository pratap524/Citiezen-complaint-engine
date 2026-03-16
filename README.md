# Citizen Complaint Intelligence Engine Backend

A Node.js/Express backend for the Citizen Complaint Intelligence Engine hackathon project. This system automatically classifies citizen complaints, assigns urgency scores, predicts resolution times, and detects problem clusters using rule-based AI simulation.

## Features

- **Automatic Complaint Classification**: Classifies complaints into departments (Sanitation, Roads, Water, Electricity, Animal Control, Illegal Construction, Other) based on keywords.
- **Urgency Scoring**: Assigns urgency scores (1-10) based on keywords and complaint frequency in the area.
- **Sentiment Analysis**: Simple sentiment detection (Very Negative, Negative, Neutral, Positive, Very Positive).
- **Resolution Time Prediction**: Predicts resolution days based on department.
- **Problem Cluster Detection**: Identifies clusters of complaints in specific areas.
- **Dashboard APIs**: Provides data for visualizations including heatmaps, department distribution, urgency rankings, and top issues.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Geospatial Queries**: MongoDB GeoJSON for location-based clustering

## API Endpoints

### Complaints
- `POST /api/complaints` - Create a new complaint
  - Body: `{ "text": "Complaint description", "longitude": 77.123, "latitude": 28.456 }`
- `GET /api/complaints` - Get all complaints (for heatmap)
- `PUT /api/complaints/:id/status` - Update complaint status
  - Body: `{ "status": "Resolved" }`

### Analytics
- `GET /api/dashboard-stats` - Dashboard statistics (total complaints, department counts, avg resolution, sentiment distribution)
- `GET /api/top-issues` - Top recurring issues based on tags
- `GET /api/urgency-ranking` - Top urgent pending complaints
- `GET /api/clusters?lng=77.123&lat=28.456&radius=500` - Check for complaint clusters in area

## Setup

1. **Clone/Setup the project**
   ```bash
   cd citizen-complaint-intelligence-engine-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file:
   ```
   # Preferred (works on most networks)
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/citizen_complaints

   # If SRV DNS lookup fails (querySrv ECONNREFUSED), use non-SRV format:
   # MONGODB_URI=mongodb://username:password@host1:27017,host2:27017,host3:27017/?authSource=admin&replicaSet=<replicaSetName>&tls=true&retryWrites=true&w=majority

   PORT=5000
   CLIENT_URL=http://localhost:3000  # For CORS
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## Database Schema

### Complaint Model
- `originalText`: String (required)
- `department`: Enum (Sanitation, Roads, Water, Electricity, Animal Control, Illegal Construction, Other)
- `urgencyScore`: Number (1-10)
- `sentiment`: Enum (Very Negative, Negative, Neutral, Positive, Very Positive)
- `predictedResolutionDays`: Number
- `keyTags`: Array of strings
- `status`: Enum (Pending, In Progress, Resolved, Closed)
- `location`: GeoJSON Point [longitude, latitude]
- `createdAt`, `updatedAt`: Timestamps

## Rule-Based AI Logic

The system uses keyword matching instead of ML models:

- **Department Classification**: Matches complaint text against department-specific keywords
- **Urgency**: Base score from urgent keywords + bonus for high complaint density in area
- **Sentiment**: Counts positive/negative keywords
- **Resolution Time**: Fixed days per department
- **Clusters**: Counts complaints within radius using MongoDB geospatial queries

## Testing

Use tools like Postman or curl to test the APIs. Example:

```bash
# Create complaint
curl -X POST http://localhost:5000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{"text":"Garbage not picked for 5 days","longitude":77.2167,"latitude":28.6139}'

# Get dashboard stats
curl http://localhost:5000/api/dashboard-stats
```

## Deployment

### Vercel (Recommended as 2 projects)

1. **Backend project** (root folder)
   - Import repo in Vercel and set root to repository root.
   - Set environment variables:
     - `MONGODB_URI`
     - `CLIENT_URL` (frontend Vercel URL)
     - `PORT=5000` (optional on Vercel)

2. **Frontend project** (`frontend_Arya` folder)
   - Create second Vercel project from same repo with root `frontend_Arya`.
   - Set `VITE_API_BASE_URL=https://<your-backend-domain>/api`.

3. **If MongoDB SRV fails in your network**
   - Error looks like: `querySrv ECONNREFUSED _mongodb._tcp.<cluster>.mongodb.net`.
   - Use a non-SRV Atlas URI (`mongodb://host1,host2,host3/...`) instead of `mongodb+srv://`.

## License

MIT License