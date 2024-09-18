module.exports = {
    name: 'kick',
    description: 'Kicks a specified user from the server with an optional reason.',
    async execute(message, args) {
        if (args.length < 1) {
            return message.reply('Please provide a user ID to kick.');
        }

        const userId = args[0];
        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            const member = await message.guild.members.fetch(userId);
            const botMember = await message.guild.members.fetch(message.client.user.id);

            if (!botMember.permissions.has('KICK_MEMBERS')) {
                return message.reply('I do not have permission to kick members.');
            }

            if (!message.member.permissions.has('KICK_MEMBERS')) {
                return message.reply('You do not have permission to use this command.');
            }

            await member.kick(reason);
            message.reply(`Successfully kicked ${member.user.tag} for: ${reason}`);
        } catch (error) {
            console.error('Error kicking user:', error);
            if (error.code === 10013) {
                message.reply('User not found in this server.');
            } else {
                message.reply('There was an error trying to kick the user.');
            }
        }
    },
};
