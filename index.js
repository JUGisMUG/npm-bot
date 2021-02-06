const discord = require('discord.js');
const client = new discord.Client();
const eventEmitter = require('events');

const error = new eventEmitter;

const fetch = require('node-fetch');

const prefix = '?';
const token = 'bruh you really want token? put your own here';

client.on('ready', () => {
	console.log('Am ready kek');
	client.user.setActivity('Anime' + '🤤', { type: 'WATCHING' });
});

error.on('error', (msg, err) => {
  msg.edit(new discord.MessageEmbed().setAuthor(err, client.user.displayAvatarURL()).setColor('RED'))
});

client.on('message', async message => {
	if (message.author.bot || !message.content.startsWith(prefix)) return;

	const args = message.content
		.slice(prefix.length)
		.trim()
		.split(/ +/g);
	const cmd = args.shift().toLowerCase();

	if (cmd === 'info') {
		if (!args[0])
			return message.channel.send(
				'Please provide the npm package for which you need information.'
			);

		let msg = await message.channel.send(
			new discord.MessageEmbed()
				.setAuthor(
					`Fetching information for: ${args[0]}`,
					client.user.displayAvatarURL()
				)
				.setColor('GREEN')
		);
		
		try {
		  fetch(`https://registry.npmjs.org/${args[0]}`)
			.then(res => res.json())
			.then(response => {
			  if (response.error) return error.emit('error', msg, `Unable to fetch information for the package: ${args[0]}`);
			  
			 let latest;
			 if (!response['dist-tags']) {
			   return error.emit('error', msg, `Unable to fetch information for the package: ${args[0]}`);
			 } else if (response['dist-tags']) {
			   let latest = response['dist-tags'].latest;
			 }
			 
			 let repository;
			 let keywords;
			 if (!response.versions[latest]) {
			   return error.emit('error', msg, `Unable to fetch information for the package: ${args[0]}`);
			 } else if (response.versions[latest]) {
			   repository = response.versions[latest].repository.url;
			   keywords = response.versions[latest].keywords;
			   keywords = keywords.join(', ');
			 } else {
			   repository = 'None';
			   keywords = 'None';
			 }
			  
			  let maintainers = response.versions[latest].maintainers.map(object => object.name).join(', ')
			  
			  let dependencies;
			  if (response.versions[latest].dependencies === undefined || null) {
			    dependencies = 'None';
			  } else {
			    dependencies = Object.keys(response.versions[latest].dependencies).join(', ');
			  }
			  
			  if (repository.includes('git+')) repository = repository.replace('git+', '')
			  if (repository.includes('.git')) repository = repository.replace('.git', '')
			  
			  let embed = new discord.MessageEmbed()
			  .setAuthor(`${args[0]} - ${latest}`, 'https://i.gyazo.com/3b2e93eb22aff52694daf56b5cf1ad75.png')
			  .setURL(`https://npmjs.com/package/${args[0]}`)
			  .setDescription(response.description ? response.description : 'None')
			  .setThumbnail(client.user.displayAvatarURL())
			  .setColor('GREEN')
			  .setFooter(keywords)
			  .addFields({
			    name: 'Maintainers:',
			    value: maintainers
			  }, {
			    name: 'Dependencies:',
			    value: dependencies
			  }, {
			    name: 'License:',
			    value: response.versions[latest].license ? response.versions[latest].license : 'None'
			  }, {
			    name: 'Repository:',
			    value: `[GitHub Repository](${repository})`
			  }, {
			    name: 'Typescript Support:',
			    value: response.versions[latest].types ? 'Yes' : 'No'
			  })
			  
			  msg.edit(embed)
			});
		} catch (err) {
	    msg.delete()
	    message.channel.send(new discord.MessageEmbed().setTitle(`An unexpected error occured:`).setDescription(err))
		}
	}
});

client.login(token);
