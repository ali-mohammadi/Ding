# Ding! Messenger App

<img src="public/images/logo.png" width="128px">

Ding! is a real-time messaging pwa application that allows users to connect and chat with each other instantly. This project is a course project developed for Internet Engineering course at University of Tehran.

The app is built using Node.js, Express.js framework for the backend, EJS template engine for rendering views, jQuery for the frontend, MySQL as the database, and Socket.io for real-time communication.

<img src="public/images/ding-preview.gif">

## Features

- Real-time messaging with other users
- User authentication and registration
- Online/Offline status
- Search and add friends
- Notification system for new messages

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js and npm should be installed on your system.
- MySQL database server (locally or remote) should be set up.

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ding-messenger.git
cd ding-messenger
```
2. Install dependencies:
```bash
npm install
```
3. Configure the database:

- Create a MySQL database for the project.
- Update the database connection settings in `controller/dbController.js`.

4. Start the application:
```bash
npm run start
```
5. Initialize the database:
```url
http://localhost:3000/install
```

Ding! now should now be running at `http://localhost:3000`.

### Tech Stack
- PWA
- Node.js
- Express.js
- EJS (Embedded JavaScript) template engine
- MySQL
- Socket.io

## Disclaimer

**This project may have security vulnerabilities and is not ready for production use. It is intended for educational purposes only.**


## Contributing

Contributions to Ding! Messenger App are welcome. If you find any bugs or want to propose new features, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Contributors
Ali Mohammadi
