## Expense Tracker App 📊💰

📝 Manage your finances efficiently with this Expense Tracker App! Track your expenses, set budgets, and visualize your spending habits to stay on top of your financial goals. Built with HTML, CSS, JavaScript, and integrated with local storage for seamless user experience.

## Table of Contents

- [Preview](#preview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Usage](#usage)
- [Acknowledgments](#acknowledgments)
- [Contact](#contact)

---

## Preview

### Desktop Preview

<img src="./Assets/exp-tracker-destop-preview.png" alt="">

### Mobile Preview

<img height="600px" src="./Assets/exp-tracker-mobile.png" alt="">

---

## Features

Here are some key features of this app:

- **☁️ Firebase Cloud Migration:** Replaced temporary local storage buckets with full cloud integration. User accounts, transaction ledgers, currency choices, and budget rules are securely synchronized across devices in real-time using Firestore nodes.
- **🔍 Multi-Criteria Filter Engine (`executeHistoryFilter`):** A brand-new feature enabling advanced data navigability. Users can effortlessly filter thousands of ledger items instantly by filtering via:
  - _Fuzzy Keyword Text Match:_ Typing specific vendors or items.
  - _Dropdown Category Tags:_ Selecting localized category definitions.
  - _Arithmetic Boundaries:_ Specifying minimum and maximum transaction value margins.
  - _Temporal Windows:_ Pinpointing start and end calendar dates.
- **🚨 Live Budget Threshold Engine:** Tracks target category parameters dynamically. When spending limits reach or exceed an operational **85% safety milestone**, the UI mutates layout properties automatically to display warning themes.
- **💱 Multi-Currency Routing & Conversion:** Comprehensive service abstraction layers supporting major global currencies (INR, USD, EUR, etc.). Calculates base balances seamlessly without dropping historical numeric focus.
- **📈 Advanced Visual Analytics Panel:** Replaced basic visual graphs with a full Chart.js visualization dashboard tracking category breakdowns and month-over-month chronological financial trends.
- **📶 Progressive Web App (PWA) Offline Isolation:** Outfitted with specialized Service Worker scripts (`sw.js`). Intercepts and caches operational styles and scripts, making the application fully accessible offline without active network coverage.
- **📱 Fluid Mobile Responsiveness:** Enhanced using adaptive CSS Media Queries and stacked column layout alignments to guarantee touch targets and clean text formatting across phone layouts.

---

## Technologies Used

- **Core Languages:** HTML5, CSS3 (Modern Flexbox/Grid), JavaScript (ES + Asynchronous Modules)
- **Cloud Architecture:** Google Firebase & Firestore NoSQL Cluster Nodes
- **Data Visualization:** Chart.js Library Suite

---

## Usage

### Installation

1. Clone the repository to your local machine using `git clone`.
2. Navigate to the project directory.
3. Install project node dependencies & automated testing libraries:
      ```shell
      npm install
      ```

4. Establish your Firebase Cloud Instance: 
   * Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add Project** to configure a new project container.  
   * Inside your new dashboard project panel, click the web icon (\</\>) to register a web application node.  
   * Navigate to your project settings sidebar to find your unique **Firebase SDK configuration parameters**.  
   * In the Firebase Console sidebar, click **Firestore Database** and choose **Create Database** (ensure you start in *test mode* or define public read/write permission schemas so your requests go through cleanly).  
5. Inject your Local Configuration Token Asset:
   * Create a brand-new file inside your project root folder named exactly **firebaseConfig.js**.  
   * Open the file and paste your credentials using this exact modular export blueprint layout format:

     ```JavaScript  
     // firebaseConfig.js  
     export const firebaseConfig \= {  
       apiKey: "YOUR\_API\_KEY\_HERE",  
       authDomain: "YOUR\_AUTH\_DOMAIN\_HERE",  
       projectId: "YOUR\_PROJECT\_ID\_HERE",  
       storageBucket: "YOUR\_STORAGE\_BUCKET\_HERE",  
       messagingSenderId: "YOUR\_MESSAGING\_SENDER\_ID\_HERE",  
       appId: "YOUR\_APP\_ID\_HERE"  
     };

   * Save the file. The core application logic modules will automatically intercept this configuration script file upon boot-up.

---


### Running the App

1. Go to `Expense-Tracker-App` folder by typing `cd Expense-Tracker-App` in terminal and type `live-server` in terminal to open Expense Tracker App in browser.

### Adding budget

- Go to the "Change Budget" section and input your preferred budget amount in the designated field. Click on the "Add" button.

### Adding Expenses

- To add expenses, go to the "Add Expense".
- Input the expense amount and select a expense tag. You can also create a custom tag by clicking on "Add tag" button.
- Clear all input fields by clicking on the "Clear" button.

### Viewing Expense History

- Go to `History` Scroll down to view your expense history.
- Sort the expense history by clicking on the dropdown to arrange transactions from high to low or low to high.

### Editing and Deleting Expenses

- In the expense history, each transaction is accompanied by edit and delete icons.
- Click on the edit icon to modify transaction details. A popup will appear where you can edit the amount, tag, or both. Click "Edit Expense" to save changes.
- To delete a transaction, click on the trash icon associated with the transaction and confirm.

### Multi-Criteria Search & History Filtering

- Locate the **Search & Filter Panel** placed directly above your transaction history log ledger.
- **Text Search:** Type a vendor name, item detail, or description into the text input box to execute a fuzzy keyword match instantly.
- **Category Filter:** Click the category dropdown element to isolate transactions belonging to a single designated tag.
- **Price Range Isolation:** Enter values into the **Min Price** and **Max Price** numeric bounds fields to display records falling within an exact budget range.
- **Date Range Window:** Use the **Start Date** and **End Date** calendar inputs to pinpoint transactions belonging to a specific day, week, or billing cycle.
- The system automatically compiles all constraints simultaneously in real-time to narrow down your records.

### Multi-Currency Switching & Conversion

- Go to the top header profile section of the application interface to find the **Currency Switcher Dropdown**.
- Click the switcher to cycle between globally supported currency formats (such as **INR (₹), USD ($), EUR (€), GBP (£)**).
- Selecting a new value will instantly convert your total remaining balance, current monthly expenditure, category ceiling trackers, and specific item rows using live base numeric calculations without dropping data focus.

### Managing Recurring Transactions

- Inside the expense insertion form, find the **"Recurring Transaction"** toggle checkbox.
- Check the box to mark an expense as a repeating transaction line, and use the adjacent frequency selector dropdown to specify its schedule interval (e.g., **Daily, Weekly, Monthly, Yearly**).
- Navigate to the dedicated **Recurring Panel Tab** to review a consolidated dashboard of your subscription commitments. You can modify target frequencies on the fly or click the trash button to cancel a repeating liability ledger sequence.

### User Session Authentication & Synchronization

- Upon booting up the application workspace interface, utilize the integrated **Authentication Modal Window**.
- Input your user credentials to complete a cloud profile handshake. Once logged in, your ledger profiles, currency preferences, active custom tags, and ceiling boundaries automatically synchronize down from the Firebase Firestore cluster in real-time.

### Setting Category Budget Limits & Trackers

- Locate the Category Budget Progress Dashboard panel on the interface.
- For each unique expense category tag, use the inline numeric input field to enter a target spending ceiling.
- The system automatically syncs this ceiling configuration to the cloud database.
- As you spend, the panel dynamically tracks expenditure ratios in real-time. If category spending reaches or exceeds 85% of your target ceiling limit, the bar color shifts instantly to an emergency red tint (#F38181) to warn against overspending.

### Mobile Screen

- The web app is designed to be responsive and mobile-friendly.

---

## Project Documentation Tree

To maintain rigorous compliance across the codebase evolution, system documentation has been modularized away from a single dense file into dedicated targets:

1. [`README.md`](./README.md) - Rapid user onboarding, environment configuration, setup steps, and project architecture overview.
2. [`CHANGELOG.md`](./CHANGELOG.md) - Chronological iteration journal recording perfective software modifications, branch versions, bug fixes, and refactoring history.
3. [`CONTRIBUTING.md`](./CONTRIBUTING.md) - Standard development guidelines, code formatting metrics, and branching policies for open-source contributors.
4. [`LICENSE`](./LICENSE) - Formal governance parameters outlining software reuse rights and legal asset compliance.
5. [`TESTING.md`](./TESTING.md) - Test strategy, run instructions, coverage map, and conventions for Jest and Cypress.

---

## Acknowledgments

This project wouldn't be possible without the following:

[Chart Js](https://www.chartjs.org/)

[Firebase](https://www.google.com/search?q=https://firebase.google.com/)

---

## Contact

- Manik Maity -[manikmaity010@gmail.com]
- [My LinkedIn](https://www.linkedin.com/in/manikmaity/)
