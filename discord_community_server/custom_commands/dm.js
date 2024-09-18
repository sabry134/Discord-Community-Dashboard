module.exports = {
    name: 'dm',
    description: 'Sends a direct message to a specified user',
    execute(message, args) {
        args = args || [];


        if (!Array.isArray(args) || args.length < 2) {
            return message.reply('Please provide a user ID and a message to send.');
        }

        const userId = args[0];
        const dmMessage = args.slice(1).join(' ');

        message.client.users.fetch(userId)
            .then(user => {
                user.send(dmMessage)
                    .then(() => message.reply(`Message sent to ${user.tag}.`))
                    .catch(error => {
                        console.error('Error sending DM:', error);
                        message.reply('Failed to send the message.');
                    });
            })
            .catch(error => {
                console.error('User not found:', error);
                message.reply('User not found.');
            });
    },
};
