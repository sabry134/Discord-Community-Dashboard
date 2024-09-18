module.exports = {
    name: 'unmute',
    description: 'Unmutes a specified user.',
    async execute(message, args) {
        if (args.length < 1) {
            return message.reply('Please provide a user ID to unmute.');
        }

        const userId = args[0];

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

            await member.roles.remove(role);
            message.reply(`Successfully unmuted ${member.user.tag}.`);
        } catch (error) {
            console.error('Error unmuting user:', error);
            if (error.code === 10013) {
                message.reply('User not found in this server.');
            } else {
                message.reply('There was an error trying to unmute the user.');
            }
        }
    },
};
