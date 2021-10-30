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

		game.settings.register('hide-gm-rolls', 'sanitize-dice-so-nice', {
			name: game.i18n.localize('hide-gm-rolls.settings.sanitize-dice-so-nice.name'),
			hint: game.i18n.localize('hide-gm-rolls.settings.sanitize-dice-so-nice.hint'),
			scope: 'world',
			config: true,
			restricted: true,
			default: true,
			type: Boolean,
		});

		game.settings.register('hide-gm-rolls', 'sanitize-crit-fail', {
			name: game.i18n.localize('hide-gm-rolls.settings.sanitize-crit-fail.name'),
			hint: game.i18n.localize('hide-gm-rolls.settings.sanitize-crit-fail.hint'),
			scope: 'world',
			config: true,
			restricted: true,
			default: true,
			type: Boolean,
		});

		game.settings.register('hide-gm-rolls', 'sanitize-better-rolls-crit-dmg', {
			name: game.i18n.localize('hide-gm-rolls.settings.sanitize-better-rolls-crit-dmg.name'),
			hint: game.i18n.localize('hide-gm-rolls.settings.sanitize-better-rolls-crit-dmg.hint'),
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

		game.settings.register('hide-gm-rolls', 'hide-player-rolls', {
			name: game.i18n.localize('hide-gm-rolls.settings.hide-player-rolls.name'),
			hint: game.i18n.localize('hide-gm-rolls.settings.hide-player-rolls.hint'),
			scope: 'world',
			config: true,
			restricted: true,
			default: false,
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

	static ready() {
		if (!game.modules.get('lib-wrapper')?.active) {
			if (game.user.isGM) {
				ui.notifications.error(
					"Module hide-gm-rolls requires the 'lib-wrapper' module. Please install and activate it.",
				);
			}
			return;
		}

		libWrapper.register(
			'hide-gm-rolls',
			'ChatLog.prototype.notify',
			(wrapped, ...args) => {
				if (args.length < 1) {
					wrapped(...args);
					return;
				}
				if (this.shouldHide(args[0])) {
					return;
				}
				wrapped(...args);
			},
			'MIXED',
		);
	}

	static isGMMessage(msg) {
		return game.user.isGM || (msg.author && !msg.author.isGM) || (!msg.author && !msg.user?.isGM);
	}

	static isPlayerMessage(msg) {
		return (msg.author?.id === game.user.id) || (!msg.author && msg.user?.id == game.user.id);
	}

	static shouldHide(msg) {
		if (!game.settings.get('hide-gm-rolls', 'hide-private-rolls') && !game.settings.get('hide-gm-rolls', 'hide-player-rolls')) return false;

		// Skip if we have an empty msg
		if (!msg) {
			return false;
		}

		// Skip processing if we're a GM, or the message did not originate from one.
		if (this.isGMMessage(msg) && !game.settings.get('hide-gm-rolls', 'hide-player-rolls')) {
			return false;
		}

		const whisper = msg.whisper || msg.data?.whisper || msg.message?.whisper || msg.message?.data?.whisper;
		// Skip if this message is not a whisper
		if (!whisper) {
			return false;
		}
		// Skip if message was whispered to the current user.
		if (
			whisper.length === 0 ||
			whisper.includes(game.user.id || game.user._id)
		) {
			return false;
		}

		// Skip if this player originated the message
		if (game.settings.get('hide-gm-rolls', 'hide-player-rolls') && this.isPlayerMessage(msg)) {
			return false;
		}

		return true;
	}

	static hideRoll(app, html, msg) {
		if (!this.shouldHide(msg)) {
			return;
		}

		if (app.data?.sound) {
			app.data.sound = null;
		}
		html.addClass('gm-roll-hidden');
		html.hide();
	}

	static _sanitizeCrits(html) {
		if (!game.settings.get('hide-gm-rolls', 'sanitize-crit-fail')) {
			return;
		}
		const total = html.find('h4.dice-total');
		if (total) {
			total.removeClass('critical');
			total.removeClass('fumble');
		}
	}

	static _sanitizeBetterRolls5e(html) {
		if (!game.modules.get('betterrolls5e')?.active) {
			return;
		}
		if (game.settings.get('hide-gm-rolls', 'sanitize-crit-fail')) {
			const success = html.find('.success');
			if (success) success.removeClass('success');
			const failure = html.find('.failure');
			if (failure) failure.removeClass('failure');
			const flavor = html.find('.flavor-text.inline');
			if (flavor) flavor.remove();
		}
		const dieIcon = html.find('.dice-total .die-icon').remove();
		if (dieIcon) dieIcon.remove();
		if (game.settings.get('hide-gm-rolls', 'sanitize-better-rolls-crit-dmg')) {
			const total = html.find('.dice-total.red-damage');
			if (!total || total.length === 0) return;
			const base = total.find('.red-base-damage');
			const crit = total.find('.red-crit-damage');
			if (!base || !crit || base.length === 0 || crit.length === 0) return;
			const sum = parseInt(base.data('value')) + parseInt(crit.data('value'));
			total.empty();
			total.text(sum);
		}
	}

	static _sanitizePF2e(html) {
		if (game.system.id !== 'pf2e') {
			return;
		}
		const tags = html.find('.flavor-text div.tags');
		if (tags) {
			tags.remove();
		}
		const dmgTags = html.find('.flavor-text span.damage-tag');
		if (dmgTags) {
			dmgTags.remove();
		}
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
		this._sanitizeCrits(html);
		this._sanitizeBetterRolls5e(html);
		this._sanitizePF2e(html);
	}

	static sanitizeCard(html, msg) {
		if (this.isGMMessage(msg)) return;
		if (game.settings.get('hide-gm-rolls', 'hide-item-description')) {
			const description = html.find('div.item-card div.card-content');
			if (description) {
				description.empty();
				description.addClass('gm-roll-hidden');
			}
		}
	}
}

Hooks.on('init', () => {
	HideGMRolls.init();
});

Hooks.on('ready', () => {
	HideGMRolls.ready();
});

Hooks.on('renderChatMessage', (app, html, msg) => {
	HideGMRolls.hideRoll(app, html, msg);
	HideGMRolls.sanitizeRoll(html, msg);
	HideGMRolls.sanitizeCard(html, msg);
});

Hooks.on('updateChatMessage', (msg, _data, _diff, id) => {
	if (
		!game.settings.get('hide-gm-rolls', 'sanitize-rolls') &&
		!game.settings.get('hide-gm-rolls', 'hide-item-description')
	)
		return;
	const html = $(`li.message[data-message-id="${id}"]`);
	HideGMRolls.sanitizeRoll(html, msg);
	HideGMRolls.sanitizeCard(html, msg);
});

Hooks.on('diceSoNiceRollStart', (_, context) => {
	if (game.settings.get('hide-gm-rolls', 'sanitize-dice-so-nice')) {
		// Skip processing if we're a GM, or the message did not originate from one.
		if (game.user.isGM || (context.user && !context.user.isGM)) {
			return true;
		}
		context.blind = true;
	}
});
