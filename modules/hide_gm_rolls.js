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

		game.settings.register('hide-gm-rolls', 'hide-item-description', {
			name: game.i18n.localize('hide-gm-rolls.settings.hide-item-description.name'),
			hint: game.i18n.localize('hide-gm-rolls.settings.hide-item-description.hint'),
			scope: 'world',
			config: true,
			restricted: true,
			default: false,
			type: Boolean,
		});
	}

	static isGMMessage(msg) {
		return game.user.isGM || (msg.author && !msg.author.isGM) || (!msg.author && msg.user.isGM);
	}

	static hideRoll(app, html, msg) {
		if (!game.settings.get('hide-gm-rolls', 'hide-private-rolls')) return;

		// Skip processing if we're a GM, or the message did not originate from one.
		if (this.isGMMessage(msg)) {
			return;
		}
		// Skip if this is a not a whisper, or if this was whispered to the user.
		if (!msg.message.whisper || msg.message.whisper.length === 0 || msg.message.whisper.includes(game.user._id)) {
			return;
		}
		if (app.data?.sound) {
			app.data.sound = null;
		}
		html.addClass('gm-roll-hidden');
		html.hide();
	}

	static sanitizeRoll(html, msg) {
		if (!game.settings.get('hide-gm-rolls', 'sanitize-rolls')) return;

		// Skip processing if we're a GM, or the message did not originate from one.
		if (this.isGMMessage(msg)) {
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
		const total = html.find('h4.dice-total');
		if (total) {
			total.removeClass('critical');
			total.removeClass('fumble');
		}
		if (game.modules.get("betterrolls5e")?.active) {
			const success = html.find('.success');
			if (success) success.removeClass('success');
			const failure = html.find('.failure');
			if (failure) failure.removeClass('failure');
			const flavor = html.find('.flavor-text.inline');
			if (flavor) flavor.remove();
		}
	}

	static sanitizeCard(html, msg) {
		if (this.isGMMessage(msg)) return;
		if (game.settings.get('hide-gm-rolls', 'hide-item-description')) {
			const description = html.find('div.item-card > div.card-content');
			if (description) description.empty();
		}
	}
}

Hooks.on('init', () => {
	HideGMRolls.init();
});

Hooks.on('renderChatMessage', (app, html, msg) => {
	HideGMRolls.hideRoll(app, html, msg);
	HideGMRolls.sanitizeRoll(html, msg);
	HideGMRolls.sanitizeCard(html, msg);
});

Hooks.on('updateChatMessage', (msg, _data, _diff, id) => {
	if (!game.settings.get('hide-gm-rolls', 'sanitize-rolls') && !game.settings.get('hide-gm-rolls', 'hide-item-description')) return;
	const html = $(`li.message[data-message-id="${id}"]`);
	HideGMRolls.sanitizeRoll(html, msg);
	HideGMRolls.sanitizeCard(html, msg);
})

Hooks.on('diceSoNiceRollStart', (_, context) => {
	if (game.settings.get('hide-gm-rolls', 'sanitize-rolls')) {
		// Skip processing if we're a GM, or the message did not originate from one.
		if (game.user.isGM || (context.user && !context.user.isGM)) {
			return true;
		}
		context.blind = true;
	}
})