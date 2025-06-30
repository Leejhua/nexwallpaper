// Main entry point for the Node.js application
console.log('Hello, Node.js!');
console.log('Welcome to your new Node.js project!');

// Example function
function greet(name = 'World') {
    return `Hello, ${name}!`;
}

// Export the function for use in other modules
module.exports = { greet };

// If this file is run directly, execute the main logic
if (require.main === module) {
    console.log(greet());
    console.log(greet('Developer'));
}
