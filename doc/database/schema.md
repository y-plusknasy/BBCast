# Firestore Database Schema

## Overview
This project uses Cloud Firestore in **Native mode**.
The database is designed to be **read-heavy**, optimized for client-side queries by the React Native application.

## Collections

### `episodes`
Stores all episodes from all programs (e.g., "6 Minute English").
Documents are identified by a unique Episode ID derived from the source URL or date to ensure idempotency.

**Document ID Format**: `[Episode ID]` (e.g., `251218`)

| Field | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String | Yes | Unique identifier for the episode. Same as Document ID. | `"251218"` |
| `programTitle` | String | Yes | The name of the program. Used for filtering. | `"6 Minute English"` |
| `title` | String | Yes | The title of the episode. | `"Learning English"` |
| `publishedAt` | Timestamp | Yes | The publication date of the episode. | `2025-12-18T00:00:00Z` |
| `audioUrl` | String | Yes | Direct URL to the MP3 file. | `"https://.../download.mp3"` |
| `sourceUrl` | String | Yes | URL of the original article. | `"https://.../ep-251218"` |
| `script` | Array<Map> | No | The conversation script. | See `Script Object` below. |
| `vocabulary` | Array<Map> | No | List of vocabulary words and definitions. | See `Vocabulary Object` below. |
| `quiz` | Array<Map> | No | Quiz data extracted from the page. | See `Quiz Object` below. |
| `updatedAt` | Timestamp | Yes | Server timestamp of when the document was last updated. | `ServerTimestamp` |

#### Sub-Objects

**Script Object**
```json
{
  "speaker": "Neil",
  "text": "Hello and welcome to 6 Minute English."
}
```

**Vocabulary Object**
```json
{
  "word": "stigma",
  "definition": "a negative belief about something which is unfair or untrue"
}
```

**Quiz Object**
```json
{
  "question": "Approximately how many varieties of edible mushrooms are there in Japan?",
  "options": [
    {
      "label": "300",
      "isCorrect": true
    },
    {
      "label": "1000",
      "isCorrect": false
    }
  ],
  "answerIndex": 0
}
```

## Indexes
* Default indexes are sufficient for current query patterns (filtering by `programTitle` and sorting by `publishedAt`).
* If complex compound queries are needed in the future, `firestore.indexes.json` will be updated.

## Security Rules
(See `firestore.rules` for implementation)
* **Read**: Allow public read (or authenticated read via Anonymous Auth).
* **Write**: Deny all writes from client SDKs. Writes are only allowed via Admin SDK (Cloud Functions / Local Scripts).
