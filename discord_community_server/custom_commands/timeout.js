const { PermissionsBitField, GuildMember } = require('discord.js');

module.exports = {
    name: 'timeout',
    description: 'Times out a user for a specified duration',
    async execute(message, args) {
        if (args.length < 2) {
            return message.reply('Please provide a user ID, duration (in minutes), and an optional reason.');
        }

        const userId = args[0];
        const duration = parseInt(args[1], 10);
        const reason = args.slice(2).join(' ') || 'No reason provided';

        if (isNaN(duration) || duration <= 0) {
            return message.reply('Please provide a valid duration in minutes.');
        }

        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply('I do not have permission to timeout members.');
        }

        try {
            const member = await message.guild.members.fetch(userId);
            if (!member) {
                return message.reply('User not found in this server.');
            }

            await member.timeout(duration * 60 * 1000, reason);
            message.reply(`User ${member.user.tag} has been timed out for ${duration} minutes.`);
        } catch (error) {
            console.error('Error timing out user:', error);
            message.reply('There was an error executing the timeout command.');
        }
    },
};
