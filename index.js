const discord = require('discord.js');
const client = new discord.Client();
const eventEmitter = require('events');
const cheerio = require('cheerio');

const error = new eventEmitter();

const fetch = require('node-fetch');

const prefix = '?';
const token = 'bruh you really want token? put your own here';

client.on('ready', () => {
	console.log('Am ready kek');
	client.user.setActivity('Anime' + '🤤', { type: 'WATCHING' });
});

error.on('error-notfound', (msg, pkg) => {
	msg.edit(new discord.MessageEmbed().setAuthor(`Unable to fetch information for the package: ${pkg}`, client.user.displayAvatarURL()).setColor('RED'));
});

client.on('message', async message => {
	if (message.author.bot || !message.content.startsWith(prefix)) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	
	const cmd = args.shift().toLowerCase();

	if (cmd === 'info') {
		if (!args[0]) return message.channel.send('Please provide the npm package for which you need information.');

		let msg = await message.channel.send(new discord.MessageEmbed().setAuthor(`Fetching information for: ${args[0]}`, client.user.displayAvatarURL()).setColor('GREEN'));

		fetch(`https://registry.npmjs.org/${args[0]}`)
			.then(res => res.json())
			.then(response => {
				if (response.error) return error.emit('error-notfound', msg, args[0]);
				
				let latest = response['dist-tags'].latest;

				let keywords = response.versions[latest].keywords;

				let repository;
				if (response.versions[latest].repository) {
					repository = response.versions[latest].repository.url;
				} else {
					repository = 'None';
				}

				let maintainers = response.versions[latest].maintainers.map(object => object.name).join(', ');

				let dependencies;
				if (response.versions[latest].dependencies) {
					dependencies = Object.keys(response.versions[latest].dependencies);
					dependencies = dependencies.join(', ');
				} else {
					dependencies = 'None';
				}

				if (repository.includes('git+')) repository = repository.replace('git+', '');
				if (repository.includes('.git')) repository = repository.replace('.git', '');

				fetch(`https://www.npmjs.com/package/${args[0]}`)
					.then(res => res.text())
					.then(r => {
						const downloads = cheerio.load(r)('._9ba9a726').text();

						let embed = new discord.MessageEmbed()
							.setAuthor(`${args[0]} - ${latest}`, 'https://i.gyazo.com/3b2e93eb22aff52694daf56b5cf1ad75.png')
							.setDescription(response.description ? response.description : 'None')
							.setThumbnail(client.user.displayAvatarURL())
							.setColor('GREEN')
							.setFooter(keywords ? keywords.join(', ') : 'None')
							.addFields(
								{
									name: 'Maintainers:',
									value: maintainers
								},
								{
									name: 'Dependencies:',
									value: dependencies
								},
								{
									name: 'License:',
									value: response.versions[latest].license ? response.versions[latest].license : 'None'
								},
								{
									name: 'Repository & Npm:',
									value: `[GitHub Repository](${repository}) - [Npm](https://www.npmjs.com/package/${args[0]})`
								},
								{
									name: 'Typescript Support:',
									value: response.versions[latest].types ? 'Yes' : 'No'
								},
								{
									name: 'Weekly Downloads:',
									value: downloads
								}
							);

						msg.edit(embed);
					});
			});
	}
});

client.login(token);
