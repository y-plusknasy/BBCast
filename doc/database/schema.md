# Firestore Database Schema

## Overview
This project uses Cloud Firestore in **Native mode**.
The database is designed to be **read-heavy**, optimized for client-side queries by the React Native application.

## Collections

### `programs`
Stores metadata and configuration for each program series (e.g., "6 Minute English").

**Document ID Format**: `[Program ID]` (e.g., `6-minute-english`)

| Field | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String | Yes | Unique identifier for the program. | `"6-minute-english"` |
| `title` | String | Yes | Display title of the program. | `"6 Minute English"` |
| `urlPath` | String | Yes | Relative path to the program's index page. | `"/learningenglish/..."` |
| `baseUrl` | String | Yes | Base URL of the source site. | `"https://www.bbc.co.uk"` |
| `updatedAt` | Timestamp | Yes | Server timestamp of last update. | `ServerTimestamp` |

### `episodes`
Stores all episodes from all programs.
Documents are identified by a unique ID combining the Program ID and the episode slug.

**Document ID Format**: `[Program ID]-[Slug]` (e.g., `6-minute-english-ep-251218`)

| Field | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `programId` | String | Yes | Reference to the parent program ID. | `"6-minute-english"` |
| `title` | String | Yes | The title of the episode. | `"Learning English"` |
| `date` | String | No | The publication date string extracted from the page. | `"26 Dec 2025"` |
| `mp3Url` | String | No | Direct URL to the MP3 file. | `"https://.../download.mp3"` |
| `url` | String | Yes | URL of the original article (Source URL). | `"https://.../ep-251218"` |
| `script` | Array<Map> | No | The conversation script. | See `Script Object` below. |
| `vocabulary` | Array<Map> | No | List of vocabulary words and definitions. | See `Vocabulary Object` below. |
| `quizContent` | Array<Map> | No | Quiz data extracted from the page. | See `Quiz Object` below. |
| `quizUrl` | String | No | URL to the quiz iframe/page. | `"https://..."` |
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
