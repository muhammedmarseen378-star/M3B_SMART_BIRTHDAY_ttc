# SMART BIRTHDAY CELEBRATION SYSTEM 🎂✨
> Futuristic, next-generation birthday information and celebration dashboard.

---

## 🌟 Key Features

1. **Automatic Birthday Detection**:
   - Identifies active birthdays today (e.g. `MUHAMMED MARSEEN C P` and `SREEDEV HARI`).
   - Separate celebration cards with age calculation, cake illustration, and custom greetings.
   - Confetti bursts, celebration chimes, and glowing animated badges.
   - Elegant empty state if no birthdays match today.

2. **Upcoming Birthdays Dashboard**:
   - Filter tabs: **Next 7 Days**, **Next 30 Days**, **This Month**, **Next Month**, and **All Upcoming**.
   - Chronological sorting starting from the nearest date.
   - December-to-January transitions handled seamlessly.
   - Today's birthdays are excluded from upcoming lists.

3. **Individual Birthday Lookup (New Feature)**:
   - Dedicated searchable selector for all 49 individuals in the dataset.
   - Real-time search by full or partial name.
   - 8-metric profile specs: DOB, current age, birth month, birthday day, next birthday date, birthday weekday, turning age, and countdown.
   - Live countdown in days, hours, and minutes.
   - Personalized, respectful birthday wish incorporating the person's actual name.

4. **All People Directory**:
   - Search by name or date of birth.
   - Filter by birthday month.
   - Sort by Nearest Upcoming, A → Z, Z → A, Youngest, Oldest.
   - Group by Month view toggle.
   - Direct click-through to open any individual's profile.

5. **Interactive Birthday Calendar**:
   - Full 12-month calendar navigation with Prev / Next / Jump to Today buttons.
   - Visual badges on dates with birthdays.
   - Clicking any date displays a popup with all people born on that day.

6. **Statistics & Analytics**:
   - Real-time metrics: Total Records, Active Today, Average Age, Data Integrity.
   - Interactive glowing monthly frequency bar chart.
   - Age demographic breakdown (<18, 18-20, 21-25, 26+).

7. **Global Header Search**:
   - Quick hotkey `Ctrl+K` or `/`.
   - Search by name, partial name, day, month, or date of birth.
   - Instant dropdown results linking directly to individual profiles.

8. **Pure Web Audio Synthesizer**:
   - Futuristic UI click sound and celebration fanfare chime without external audio files.
   - Toggle button in header to mute / unmute anytime.

---

## 📊 Dataset & Excel Integration

The bundled dataset contains the **49 people** provided in the master list.

### Updating or Changing the Excel File:
1. Place your Excel file (e.g. `birthdays.xlsx`, `birthdays.xls`, or `data.xlsx`) in the `data/` folder or project root.
2. Ensure columns are named `Name` (or `Your Name`) and `Date of Birth` (or `Birth date`, `DOB`).
3. Run the import command in your terminal:
   ```bash
   npm run import-excel
   ```
4. SheetJS (`xlsx`) will automatically validate the dates, preserve names exactly, and bundle the records into `src/data/birthdays.json` and `public/birthdays.json`.

---

## 🚀 Running Locally

### Option 1: Built-in Node Server
```bash
npm start
```
Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Open Directly
Double-click `index.html` in your file explorer. It uses pre-bundled fallback data, so all 49 profiles and celebration features work even without a web server.

---

## 🌐 Deploying to Netlify

The repository is **100% pre-configured for Netlify**:

### Method 1: Netlify Drag & Drop (Fastest - 30 seconds)
1. Go to [app.netlify.com](https://app.netlify.com).
2. Go to **Sites** and drag & drop this entire project folder (`BIRTHDATRE`) onto the Netlify dashboard.
3. Your futuristic site is live immediately!

### Method 2: Git Repository Deploy
1. Push this project to GitHub / GitLab / Bitbucket.
2. In Netlify, click **Add new site** > **Import an existing project**.
3. Select the repository.
4. Build settings are already set in `netlify.toml`:
   - **Publish directory**: `.`
   - **Build command**: `npm run build`
5. Click **Deploy Site**.
