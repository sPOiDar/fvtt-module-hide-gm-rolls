class HideGMRolls {
	static init() {
		game.settings.register('hide-gm-rolls', 'sanitize-rolls', {
			name: game.i18n.localize('hide-gm-rolls.settings.sanitize-rolls.name'),
			hint: game.i18n.localize('hide-gm-rolls.settings.sanitize-rolls.hint'),
			scope: 'world',
			config: true,
			restricted: true,
			default: true,
			type: Boolean,
		});
		game.settings.register('hide-gm-rolls', 'hide-private-rolls', {
			name: game.i18n.localize('hide-gm-rolls.settings.hide-private-rolls.name'),
			hint: game.i18n.localize('hide-gm-rolls.settings.hide-private-rolls.hint'),
			scope: 'world',
			config: true,
			restricted: true,
			default: true,
			type: Boolean,
		});
	}
	static hideRoll(html, msg) {
		// Skip processing if we're a GM, or the message did not originate from one.
		if (game.user.isGM || (msg.author && !msg.author.isGM) || (!msg.author && msg.user.isGM)) {
			return;
		}
		// Skip if this is a not a whisper, or if this was whispered to the user.
		if (!msg.message.whisper || msg.message.whisper === [] || msg.message.whisper.includes(game.user._id)) {
			return;
		}
		if (msg.message && msg.message.sound) {
			msg.message.sound = '';
		} else if (msg.sound) {
			msg.sound = '';
		}
		html.addClass('gm-roll-hidden');
		html.hide();
	}

	static sanitizeRoll(html, msg) {
		// Skip processing if we're a GM, or the message did not originate from one.
		if (game.user.isGM || (msg.author && !msg.author.isGM) || (!msg.author && msg.user.isGM)) {
			return;
		}
		const formula = html.find('div.dice-formula');
		if (formula) {
			formula.remove();
		}
		const tooltip = html.find('div.dice-tooltip');
		if (tooltip) {
			tooltip.remove();
		}
	}
}

Hooks.on('init', () => {
	HideGMRolls.init();
});

Hooks.on('renderChatMessage', (_app, html, msg) => {
	if (game.settings.get('hide-gm-rolls', 'hide-private-rolls')) {
		HideGMRolls.hideRoll(html, msg);
	}
	if (game.settings.get('hide-gm-rolls', 'sanitize-rolls')) {
		HideGMRolls.sanitizeRoll(html, msg);
	}
});

Hooks.on('updateChatMessage', (msg, _data, _diff, id) => {
	if (game.settings.get('hide-gm-rolls', 'sanitize-rolls')) {
		const html = $(`li.message[data-message-id="${id}"]`);
		HideGMRolls.sanitizeRoll(html, msg);
	}
})