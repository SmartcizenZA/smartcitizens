var convict = require('convict');

var config = convict({
  mainServer: {
    host: {
      doc: 'The fully qualified host name of the Smart Citizen Server',
      format: String,
      default: 'http://localhost:3000',
      env: 'CENTRAL_SERVER_HOST',
      arg: 'smart-citizen-server-host'
    }
  },
	env: {
		doc: 'Smart Citizen Application Environment.', 
		format: ['production', 'development', 'demo'],
		default: 'development',
		env: 'NODE_ENV',
		arg: 'env'	
	},
	express: {
		ip: {
			doc: 'The IP address to bind.',
			format: 'ipaddress',
			default: '127.0.0.1',
			env: 'IP_ADDRESS'
		},
		http: {
			port: {
				doc: 'HTTP port to bind.',
		    format: 'port',
		    default: '9000',
				env: 'HTTP_PORT',
				arg: 'port'
			}
		},
		cookieParser: {
			secret: {
					doc: 'Cookie parser for Express',
					default: 'c1TiZ3nC00k13',
					env: 'COOKIE_PARSER_SECRET',
					arg: 'cookie-parser-secret'
				}
		}
	},  
	database: {
		host: {
			doc: 'Database server host',
			format: 'ipaddress',
			default: '127.0.0.1',
			env: 'DATABASE_HOST',
			arg: 'database-host'
		},
    port: {
      doc: 'Database server port',
      format: 'port',
      default: '5432',
      env: 'DATABASE_PORT',
      arg: 'database-port'
    },
		database: {
			doc: 'Database name',
			default: '',
			env: 'DATABASE_NAME',
			arg: 'database-name'
		},
		user: {
			doc: 'Database user',
			default: '',
			env: 'DATABASE_USER',
			arg: 'database-user'
		},
		password: {
			doc: 'Database password',
			default: '',
			env: 'DATABASE_PASSWORD',
			arg: 'database-password'
		},
		debug: {
			doc: 'Database debugging output',
			default: 'false',
			env: 'DATABASE_DEBUG',
			arg: 'database-debug'
		}
	},
	logger: {
		level: {
			doc: 'Log level',
		  default: 'info',
			env: 'LOG_LEVEL',
			arg: 'log-level'
	  },
		src: {
			doc: 'Log src information',
			default: false,
			env: 'LOG_SRC',
			arg: 'log-src'
	  },
		file: {
			doc: 'Log file',
			default: '/var/log/citizen.log',
			env: 'LOG_LOCATION',
			arg: 'log-location'
		}
	}
});

//loads environment dependent configuration
config.loadFile(__dirname + '/' + config.get('env') + '.json');

//validate configuration
config.validate();

module.exports = config;
