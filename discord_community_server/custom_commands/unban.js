module.exports = {
    name: 'unban',
    description: 'Unbans a specified user from the server.',
    async execute(message, args) {
        if (args.length < 1) {
            return message.reply('Please provide a user ID to unban.');
        }

        const userId = args[0];

        try {
            const botMember = await message.guild.members.fetch(message.client.user.id);

            if (!botMember.permissions.has('BAN_MEMBERS')) {
                return message.reply('I do not have permission to unban members.');
            }

            if (!message.member.permissions.has('BAN_MEMBERS')) {
                return message.reply('You do not have permission to use this command.');
            }

            await message.guild.bans.remove(userId);
            message.reply(`Successfully unbanned the user with ID: ${userId}`);
        } catch (error) {
            console.error('Error unbanning user:', error);
            if (error.code === 10013) {
                message.reply('User not found in this server.');
            } else {
                message.reply('There was an error trying to unban the user.');
            }
        }
    },
};
