module.exports = {
    name: 'timeout',
    description: 'Mutes a specified user for a specified duration.',
    async execute(message, args) {
        if (args.length < 2) {
            return message.reply('Please provide a user ID and a duration in minutes.');
        }

        const userId = args[0];
        const duration = parseInt(args[1], 10);
        const reason = args.slice(2).join(' ') || 'No reason provided';

        if (isNaN(duration) || duration <= 0) {
            return message.reply('Please provide a valid duration in minutes.');
        }

        try {
            const member = await message.guild.members.fetch(userId);
            const botMember = await message.guild.members.fetch(message.client.user.id);
            const role = message.guild.roles.cache.find(role => role.name === 'Muted');

            if (!botMember.permissions.has('MANAGE_ROLES')) {
                return message.reply('I do not have permission to manage roles.');
            }

            if (!message.member.permissions.has('MANAGE_ROLES')) {
                return message.reply('You do not have permission to use this command.');
            }

            if (!role) {
                return message.reply('Muted role not found.');
            }

            await member.roles.add(role, reason);
            message.reply(`Successfully muted ${member.user.tag} for ${duration} minutes.`);

            setTimeout(async () => {
                await member.roles.remove(role);
                message.channel.send(`${member.user.tag} has been unmuted.`);
            }, duration * 60 * 1000);
        } catch (error) {
            console.error('Error timing out user:', error);
            if (error.code === 10013) {
                message.reply('User not found in this server.');
            } else {
                message.reply('There was an error trying to timeout the user.');
            }
        }
    },
};
