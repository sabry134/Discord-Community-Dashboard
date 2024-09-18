
module.exports = {
    name: 'hello',
    description: 'Replies with Hello, World!',
    execute(message) {
        message.channel.send('Hello, World!');
    },
};
