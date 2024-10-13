# Next.js and Flask Project

This project consists of a Next.js application and a Flask server running concurrently. A shell script (`run.sh`) is provided to easily start both applications.

## Prerequisites

Before running the project, ensure you have the following installed:

- Node.js and npm (for Next.js)
- Python (for Flask)
- Bash shell (available by default on most Unix-based systems, including macOS and Linux)

## Project Structure

The project should have the following structure:

```
project_root/
│
├── nextjs_app/        # Your Next.js application
│   └── ...
│
├── loadbalancer.py    # Your Flask server script
├── run.sh             # Script to run both applications
└── README.md          # This file
```

## Running the Applications

To run both the Next.js app and Flask server simultaneously:

1. Open a terminal and navigate to the project root directory.
2. Make sure the `run.sh` script is executable:
   ```
   chmod +x run.sh
   ```
3. Run the script:
   ```
   ./run.sh
   ```

The script will start both applications:
- The Next.js app will run on its default port (usually 3000)
- The Flask server will run on its configured port (check the `loadbalancer.py` file for the specific port)

To stop both applications, press `Ctrl+C` in the terminal where you ran the script.

