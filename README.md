# DBWA-Project: WatchItLater
Making Movies & Shows great again.
(using MYSQL as database. It will setup itself after putting in credentials and start the application)

## Quick Start

**Prerequisites:**
- Node.js (v20 or later recommended)
- npm (comes with Node.js)

**Installation & Running:**

1.  **Install Dependencies:**
    Open your terminal and navigate to the project root directory:
    ```bash
    cd path/to/your/project
    npm install
    ```
2. **Edit Enviroments:**
3. Add your [tmdb-api-token](https://developer.themoviedb.org/docs/getting-started) (you need to be loggedin) and mysql database credentials (with you started before launching the app) to the [enviroment.ts](https://github.com/Hamschter-HSB/dbwa-project-mysql/blob/main/dbwa-project-app/src/environments/environment.ts).

2.  **Start the Server:**
    This command builds the Angular application and starts the Node.js server.
    ```bash
    npm run build && npm run serve:ssr:dbwa-project-app
    ```

3.  **Access the App:**
    Open your web browser and go to: **http://localhost:4000**


--> If database has been rebuilt delete all local storage auth tokens. Every token leads to one account that is in this case new!
