module.exports = {
    name: 'ban',
    description: 'Bans a specified user from the server with an optional reason.',
    async execute(message, args) {
        if (args.length < 1) {
            return message.reply('Please provide a user ID to ban.');
        }

        const userId = args[0];
        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            const member = await message.guild.members.fetch(userId);

            const botMember = await message.guild.members.fetch(message.client.user.id);

            if (!botMember.permissions.has('BAN_MEMBERS')) {
                return message.reply('I do not have permission to ban members.');
            }

            if (message.author.id !== message.client.user.id && !message.member.permissions.has('BAN_MEMBERS')) {
                return message.reply('You do not have permission to use this command.');
            }

            await member.ban({ reason });
            message.reply(`Successfully banned ${member.user.tag} for: ${reason}`);
        } catch (error) {
            console.error('Error banning user:', error);
            if (error.code === 10013) {
                message.reply('User not found in this server.');
            } else {
                message.reply('There was an error trying to ban the user.');
            }
        }
    },
};
