const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'untimeout',
    description: 'Removes the timeout from a specified user',
    async execute(message, args) {
        if (args.length < 1) {
            return message.reply('Please provide a user ID.');
        }

        const userId = args[0];

        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply('I do not have permission to remove timeouts from members.');
        }

        try {
            const member = await message.guild.members.fetch(userId);
            if (!member) {
                return message.reply('User not found in this server.');
            }

            await member.timeout(null);
            message.reply(`Timeout removed for user ${member.user.tag}.`);
        } catch (error) {
            console.error('Error removing timeout from user:', error);
            message.reply('There was an error executing the untimeout command.');
        }
    },
};
