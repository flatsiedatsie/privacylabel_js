;
(function(global) {
	var Privacylabel = function(desired_target, desired_language, desired_label_object) {
		return new Privacylabel.init(desired_target, desired_language, desired_label_object);
	}
	var privacylabel = {};
	privacylabel["version_year"] = "2020";
	privacylabel["version_month"] = "04";
	privacylabel["version_info"] = ""
	
	var duration_array = ['most_data', 'some_data', 'a_little_data', 'least_amount_of_data'];

	const label_sections = ["intro", "collection", "location","duration","purpose","legal","sharing","action","updated"];

	Privacylabel.prototype = {
		report: function(notice) {
			self = this;
            if(self.debug){
                console.log("Privacy Label: " + notice);
            }
		},
		
        // Get
        getLanguage: function() {
            self = this;
			return self.language;
		},
        getSuppportedLanguages: function() {
            self = this;
			return Object.keys(self.translations);
		},
		getLabelId: function() {
            self = this;
			return self.label_id;
		},
		getLabelData: function() {
            self = this;
			return self.label_data;
		},
		getShorterCode: function() {
            self = this;
			return self.shorter_code;
		},
		getShortCode: function() {
            self = this;
			return self.short_code;
		},
		setTarget: function(desired_target) {
			self = this;
			if (typeof desired_target == "string") {
				self.target = desired_target;
			} else {
				self.report("Please provide an ID or class name for the target element");
			}
			return this;
		},
		setDebug: function(desired_debug) {
			self = this;
            if(typeof desired_debug == "boolean"){
                self.debug = desired_debug;
				console.log("Privacy Label: debug set to " + self.debug);
            }
			return this;
		},
		setAllowWebsiteLink: function(desired_link_state) {
            self = this;
            if(typeof desired_link_state == "boolean"){
				self.allow_link_to_privacylabel_website = desired_link_state
            }
			return this;
		},
		setLanguage: function(desired_language) {
			self = this;
			// Validate language
			if (typeof desired_language == "string") {
				desired_language = desired_language.toLowerCase();
				self.report("validating a language string " + desired_language);
				
				//self.desired_language = self.desired_language.toLowerCase();
				
				
				if( Object.keys(self.translations).indexOf( desired_language ) === -1) {
					self.report(desired_language + " is not available in the loaded translations.");
					self.language = 'en-uk';
					return false;
				} else {
					self.language = desired_language;
					self.report("Language changed to " + self.language);
					
				}
				return true;
			}
			return false;
		},
		loadLabelJson: function(json_url) {
			self = this;
			self.report("loadLabelJson with URL " + json_url);
			self.download(self,json_url,"label");
		},
		loadLanguageJson: function(self, json_url, translation_name) {
			self = this;
			if( translation_name === undefined){var translation_name = 'custom'}
			self.report("loadLanguageJson with URL " + json_url);
			self.download(self,json_url,"language",translation_name);
			
		},
		download: function(self, json_url, type, key){ // Internal
			self.download_queue++;
			var client = new XMLHttpRequest();
			client.open('GET', json_url);
			client.onload = function() {
				self.report("Received json: " + client.responseText);
			   	try{
					var parsed = JSON.parse(client.responseText);
					if(type == "label"){
						self.loadLabelObject(parsed);
					}
					else{
						self.loadLanguageObject(parsed,key);
					}
				}
				catch(e){self.report("Error loading JSON: " + e);}
				self.checkAllLoaded(self);
			};
			client.onerror = function() { 
				self.report("Error downloading file.");
				self.checkAllLoaded(self);
			};
			client.send();
		},
		loadLabelObject: function(desired_object) {
			self = this;
			function isObject(obj)
		    {
		        return obj !== undefined && obj !== null && obj.constructor == Object;
		    }
			if( isObject(desired_object)){
				
				for(var i = 0; i < label_sections.length; i++){
					var section_key = String(label_sections[i]);
					if( !section_key in desired_object ){
						self.report("Label data didn't contain all sections");
						return false;
					}
				}
				if(!'title' in desired_object["intro"] || !'updated_year' in desired_object["updated"]){
					self.report("The label data is incomplete");
					return false;
				}
				self.label_data = desired_object;

				self.report("self.label_data is now: " + JSON.stringify(self.label_data,null,2));
			
			}
			else{
				self.report("undefined object");
			}
		
		},
		loadLanguageObject: function(desired_object, translation_name) {
			self = this;
			if( translation_name === undefined){var translation_name = 'custom'}
			function isObject(obj)
		    {
		        return obj !== undefined && obj !== null && obj.constructor == Object;
		    }
			if( isObject(desired_object) ){
				if( desired_object.constructor == Object){
					self.report("Validating a language object: " + JSON.stringify( desired_object ));
				
					if(!'collection' in desired_object || !'action' in desired_object){
						self.report("The translation data is incomplete");
						return false;
					}
					else{
						self.translations['translation_name'] = desired_object;
						self.report("Added translation. Translation data is now: " + JSON.stringify(self.translations,null,2));
						return true;
					}
				}
			}
			else{
				return false;
			}
		},
		checkAllLoaded: function(self) {
			self.download_queue -= 1;
			self.report("Files to load count is now:" + self.download_queue);
			if (self.download_queue == 0) {
				self.generate();
			}
		},
		generate: function() {
			self = this;
			if (self.download_queue == 0 && self.label_data != null) {
				if(self.language == null){
					try{
						self.setLanguage(self.label_data['intro']['language']);
						
					}
					catch(e){self.report("Error setting language. reverting to en-uk: " + e); self.language = 'en-uk';}
				}
				self.generatePrivacylabel(self);
			}
			else{
				self.report("Cannot generate label (yet). Download queue size: " + self.download_queue);
			}
			return this;
		},
		
		loadShortCode: function(short_string) {
			self.report("in loadShortCode with string: " + short_string);
			self = this;
			
			if(typeof short_string != 'string'){
				self.report("Invalid shortcode, should be string");
				return this;
			}
			
			if( short_string.length > 10 && short_string.indexOf('Z') != -1){
				
				var new_json = {
					'intro':{},
					'collection':{},
					'location':{},
					'duration':{},
					'purpose':{},
					'legal':{},
					'sharing':{},
					'action':{},
					'updated':{},
				};
			
				if( short_string.charAt(0) == '?'){
					short_string = short_string.substring(1);
				}
				
				var second_code = short_string.substr(short_string.indexOf('Z')+1);
				if( second_code.length > 0 ){
					self.short_code = short_string;
					self.report("second code part: " + second_code);
					try{
						var parts = second_code.split("-");
			
						for (var i = 0; i < parts.length; i++) {
							if(String(parts[i]).length == 0){
								continue;
							}

							var first_letter = parts[i].charAt(0);
							var decoded = atob( parts[i].substring(1) );
							if(first_letter == 'T'){
								new_json['intro']['title'] = decoded;
							}
							else if(first_letter == 'D'){
								new_json['intro']['description'] = decoded;
							}
							else if(first_letter == 'R'){
								new_json['action']['privacy_policy'] = decoded;
							}
							else if(first_letter == 'M'){
								new_json['action']['manage_data'] = decoded;
							}
							else if(first_letter == 'C'){
								new_json['action']['contact'] = decoded;
							}
							else if(first_letter == 'E'){
								new_json['action']['email'] = decoded;
							}
							else if(first_letter == 'P'){
								new_json['action']['phone'] = decoded;
							}
						}
					}
					catch(e){self.report(e);}
				}
				
				// Regenerate from letter code
				var first_code = short_string.substr(0,short_string.indexOf('Z'));
				
				if( first_code.length > 6 ){
		            self.shorter_code = first_code;
					self.report("first code part: " + self.shorter_code);
				
				
					var extracted_language = short_string.substr(0, short_string.indexOf('2')).toLowerCase();
					self.report("Extracted language: " + extracted_language);
					if( extracted_language.length > 1){
						self.setLanguage(extracted_language);
					}
					new_json['intro']['language'] = self.language;
					self.report("reconstructed language = " + new_json['intro']['language']);
            
					var current_section_number = "";
					var look_ahead_section_number = "";
					var duration_counter = 0;
					var shortcode = first_code.slice(0, -6);
					var current_section_keyword = "";
					var current_item_keyword = "";
					var current_keyword = "";
			
					for (var i = 0; i < shortcode.length; i++) {
						character = shortcode.charAt(i);
						if ('0123456789'.indexOf(character) !== -1) {
							current_section_number = character;
							look_ahead_section_number = String(Number(current_section_number) + 1);
						}

						var active = false;
						
						// do reverse lookup in the Code translation table
						for (var keyword in self.translations['code']) {
							if( active == false && self.translations['code'][String(keyword)] == String(current_section_number) ){ // if we spot a section
								if( current_section_keyword != keyword ){
									current_section_keyword = keyword;
									break;
								}
								active = true;
							} 
							else if (active && String(self.translations['code'][String(keyword)]) == String(character) ) {
						
								// Reconstruct sections
								if (current_section_keyword == 'collection') {
									if ('ABC'.indexOf(character) !== -1) {
										new_json[current_section_keyword][current_item_keyword][keyword] = 1;
									} else {
										current_item_keyword = keyword;
										new_json[current_section_keyword][current_item_keyword] = {};
									}
								} else if (current_section_keyword == 'location') {
									new_json[current_section_keyword]['processed_outside_the_eu'] = {'value':keyword};
							
								} else if (current_section_keyword == 'duration') {
									var duration_item_name = duration_array[duration_counter];
									new_json[current_section_keyword][duration_item_name] = {'value':keyword};
									duration_counter++;
						
								} else if (current_section_keyword == 'purpose' || current_section_keyword == 'legal' || current_section_keyword == 'sharing') {
									new_json[current_section_keyword][keyword] = {};
								}
						
							} 
							else if (active && self.translations['code'][String(keyword)] == String(look_ahead_section_number)) { // We should not try the code beyond this code
								active = false;
							}
						}
					}
								
				
					var date_string = first_code.substring(first_code.length - 6, first_code.length);
					if ('0123456789'.indexOf( date_string.charAt(0) ) !== -1) {
						new_json['updated']['updated_year'] = '20' + date_string.substring(0, 2);
						new_json['updated']['updated_month'] = date_string.substring(2, 4);
						new_json['updated']['updated_day'] = date_string.substring(4, 6);
					}
					self.desired_label = new_json;
					self.label_data = new_json; // strange to circumvent the validation here.
				}
			}
			return this;
		},
		
		generatePrivacylabel: function(self) {
			var label_data = self.label_data;
			var i18n_dictionary = self.translations[self.language];
			var target_element = self.target;
			var generated_shortcode = "";
			var shortcode_second_part = "";
			var generated_html = "";
			var row_count = 0;
			var label_title = "";
			var label_contact_url = "";
			
			function privacylabelAddSectionHeader(key) {
				const pl_icons = {
					'collection': {
						'name': 'profile',
						'path': '<path d="M27 0h-24c-1.65 0-3 1.35-3 3v26c0 1.65 1.35 3 3 3h24c1.65 0 3-1.35 3-3v-26c0-1.65-1.35-3-3-3zM26 28h-22v-24h22v24zM8 18h14v2h-14zM8 22h14v2h-14zM10 9c0-1.657 1.343-3 3-3s3 1.343 3 3c0 1.657-1.343 3-3 3s-3-1.343-3-3zM15 12h-4c-1.65 0-3 0.9-3 2v2h10v-2c0-1.1-1.35-2-3-2z"></path>'
					},
					'duration': {
						'name': 'clock',
						'path': '<path d="M20.586 23.414l-6.586-6.586v-8.828h4v7.172l5.414 5.414zM16 0c-8.837 0-16 7.163-16 16s7.163 16 16 16 16-7.163 16-16-7.163-16-16-16zM16 28c-6.627 0-12-5.373-12-12s5.373-12 12-12c6.627 0 12 5.373 12 12s-5.373 12-12 12z"></path>'
					},
					'location': {
						'name': 'location',
						'path': '<path d="M16 0c-5.523 0-10 4.477-10 10 0 10 10 22 10 22s10-12 10-22c0-5.523-4.477-10-10-10zM16 16c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"></path>'
					},
					'purpose': {
						'name': 'flag',
						'path': '<path d="M0 0h4v32h-4v-32z"></path><path d="M26 20.094c2.582 0 4.83-0.625 6-1.547v-16c-1.17 0.922-3.418 1.547-6 1.547s-4.83-0.625-6-1.547v16c1.17 0.922 3.418 1.547 6 1.547z"></path><path d="M19 1.016c-1.466-0.623-3.61-1.016-6-1.016-3.012 0-5.635 0.625-7 1.547v16c1.365-0.922 3.988-1.547 7-1.547 2.39 0 4.534 0.393 6 1.016v-16z"></path>'
					},
					'legal': {
						'name': 'library',
						'path': '<path d="M32 30v-2h-2v-12h2v-2h-6v2h2v12h-6v-12h2v-2h-6v2h2v12h-6v-12h2v-2h-6v2h2v12h-6v-12h2v-2h-6v2h2v12h-2v2h-2v2h34v-2h-2z"></path><path d="M16 0h2l16 10v2h-34v-2l16-10z"></path>'
					},
					'sharing': {
						'name': 'svg',
						'path': '<path d="M29 13c-0.888 0-1.686 0.386-2.236 1h-5.936l4.197-4.197c0.822 0.046 1.66-0.245 2.288-0.874 1.172-1.172 1.172-3.071 0-4.243s-3.071-1.172-4.243 0c-0.628 0.628-0.919 1.466-0.874 2.288l-4.197 4.197v-5.936c0.614-0.549 1-1.347 1-2.236 0-1.657-1.343-3-3-3s-3 1.343-3 3c0 0.888 0.386 1.686 1 2.236v5.936l-4.197-4.197c0.045-0.822-0.245-1.66-0.874-2.288-1.172-1.172-3.071-1.172-4.243 0s-1.172 3.071 0 4.243c0.628 0.628 1.466 0.919 2.288 0.874l4.197 4.197h-5.936c-0.549-0.614-1.347-1-2.236-1-1.657 0-3 1.343-3 3s1.343 3 3 3c0.888 0 1.686-0.386 2.236-1h5.936l-4.197 4.197c-0.822-0.046-1.66 0.245-2.288 0.874-1.172 1.172-1.172 3.071 0 4.243s3.071 1.172 4.243 0c0.628-0.628 0.919-1.466 0.874-2.288l4.197-4.197v5.936c-0.614 0.549-1 1.347-1 2.235 0 1.657 1.343 3 3 3s3-1.343 3-3c0-0.888-0.386-1.686-1-2.236v-5.936l4.197 4.197c-0.046 0.822 0.245 1.66 0.874 2.288 1.172 1.172 3.071 1.172 4.243 0s1.172-3.071 0-4.243c-0.628-0.628-1.466-0.919-2.288-0.874l-4.197-4.197h5.936c0.549 0.614 1.347 1 2.235 1 1.657 0 3-1.343 3-3s-1.343-3-3-3z"></path>'
					},
					'action': {
						'name': 'user-tie',
						'path': '<path d="M10 6c0-3.314 2.686-6 6-6s6 2.686 6 6c0 3.314-2.686 6-6 6s-6-2.686-6-6zM24.002 14h-1.107l-6.222 12.633 2.327-11.633-3-3-3 3 2.327 11.633-6.222-12.633h-1.107c-3.998 0-3.998 2.687-3.998 6v10h24v-10c0-3.313 0-6-3.998-6z"></path>'
					},
				};
				var new_header = '';
				try{
					new_header += '<div class="pl-section-header">';
					new_header += '<span class="pl-section-icon-container"><svg class="pl-icon-' + pl_icons[key].name + ' pl-icon pl-section-icon" width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">';
					new_header += pl_icons[key].path;
					new_header += '</svg></span><span class="pl-space"> </span>';
					new_header += '<strong class="pl-section-title" data-pl-i18n="' + key + '">' + plTranslate(key) + '</strong>';
					var explanation_data = {
						'explanation': plTranslate("section_" + key + "_explanation"),
						'url': 'https://www.privacylabel.org/learn/' + key
					};
					new_header += privacylabelAddExplanation(explanation_data, "section_" + key);
					new_header += '</div>';
				}
				catch(e){self.report(e);}
				return new_header;
			}

			function plGenerateExplanationClasses(content) {
				var extra_classes = "";
				if (content.explanation !== undefined && content.explanation != '') {
					extra_classes += " pl-has-text";
				}
				if (content.url !== undefined && content.url != '') {
					extra_classes += " pl-has-link";
				}
				return extra_classes;
			}

			function privacylabelAddExplanation(content, explanation_name) {
				//if( explanation_name === undefined)
				//console.log("explanation content = " + JSON.stringify(content));
				var additional_html = '';
				if ((content.explanation !== undefined && content.explanation != '') || (content.url !== undefined && content.url != '')) {
					var keyword_attribute = ' data-pl-keyword="' + explanation_name.replace(/-/g, "_") + '"';
					var blockquote_class = "pl-explanation-" + explanation_name.replace(/_/g, "-") + " ";
					additional_html += '<span class="pl-button-show" tabindex="-1">';
					//additional_html += '<svg class="pl-icon-info pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 28"><path d="M16 21.5v-2.5c0-0.281-0.219-0.5-0.5-0.5h-1.5v-8c0-0.281-0.219-0.5-0.5-0.5h-5c-0.281 0-0.5 0.219-0.5 0.5v2.5c0 0.281 0.219 0.5 0.5 0.5h1.5v5h-1.5c-0.281 0-0.5 0.219-0.5 0.5v2.5c0 0.281 0.219 0.5 0.5 0.5h7c0.281 0 0.5-0.219 0.5-0.5zM14 7.5v-2.5c0-0.281-0.219-0.5-0.5-0.5h-3c-0.281 0-0.5 0.219-0.5 0.5v2.5c0 0.281 0.219 0.5 0.5 0.5h3c0.281 0 0.5-0.219 0.5-0.5zM24 14c0 6.625-5.375 12-12 12s-12-5.375-12-12 5.375-12 12-12 12 5.375 12 12z"></path></svg>';
					additional_html += '</span>';
					additional_html += '<blockquote class="' + blockquote_class + 'pl-explanation"';
					if(explanation_name.charAt(0) == 's'){ // section
						additional_html += ' style="display:none"';
					}
					additional_html += '>';
					if (content.explanation !== undefined && content.explanation != '') {
						additional_html += '<span class="pl-explanation-text"' + keyword_attribute + '>' + content.explanation + '</span>';
					}
					if (content.url !== undefined && content.url != '') {
						additional_html += '<span class="pl-space"> </span><span class="pl-explanation-link"><a href="' + content.url + '"><span class="pl-learn-more" data-pl-keyword="learn_more">' + plTranslate('learn_more') + '</a></span>';
					}
					additional_html += '</blockquote>';
				}
				return additional_html;
			}

			function plShortener(long_string) {
				long_string = long_string.toLowerCase();
				if (long_string.indexOf(" ") != -1) {
					long_string = long_string.substr(0, long_string.indexOf(" "));
				}
				if (long_string.indexOf("_") != -1) {
					long_string = long_string.substr(0, long_string.indexOf("_"));
				}
				return long_string;
			}

			function plTranslate(keyword, lowercase) { // Set lowercase to true to not capitalise the words being translated.
				//console.log("i18n_dictionary = " + i18n_dictionary);
				try {
					if (i18n_dictionary[keyword]) {
						keyword = i18n_dictionary[keyword];
					} else if(keyword != "-"){
						keyword = keyword.replace(/_/g, ' '); // At least make the missing translation text look presentable.
						self.report("missing translation for: " + keyword);
					}
					//keyword = keyword.charAt(0).toUpperCase() + keyword.slice(1); // Capilatize it while we're at it.
				} catch (e) {
					self.report("translation error: " + e);
				}
				
				// Capitalize
				if( lowercase === undefined ){
					keyword = keyword.charAt(0).toUpperCase() + keyword.slice(1); 
				}
				
				return keyword;
			}

			function get_shortcode_letter(self,keyword) {
				var new_letter = "";
				try{
				//console.log("parent.self.translations: " + JSON.stringify(parent.self.translations ));
				//console.log("parent.translations['code'] in shortcode letter getter: " + parent.self.translations['code']);
					if ( self.translations['code'][keyword] !== undefined && String(self.translations['code'][keyword]).length == 1 ){
						new_letter =  self.translations['code'][keyword];
					}
				}
				catch(e){self.report(e);}
				return new_letter;
			}
			
			function wrap_list(list_html,none_message){
				var none_class = "";
				if(list_html == ""){
                    none_class = " pl-none";
                    if(none_message != ''){
                        list_html = '<li class="pl-item">' + plTranslate(none_message) + '</li>';
                    }
                }
				var wrapped = '<ul class="pl-list' + none_class + '">' + list_html + '</ul>';
				return wrapped;
			}
			
            function base_encode(value){
                try{
                    value = window.btoa(String(value));
                }
                catch(e){self.report(e);}
                return value;
            }

				
			generated_html += '<div class="privacylabel" style="border:1px solid;box-sizing:border-box">';
			
			for(var i = 0; i < label_sections.length; i++){
				section_key = label_sections[i];
				section = label_data[section_key];
                generated_shortcode += get_shortcode_letter(self,section_key);
                
                
                var generated_list = "";
				//console.log("_____section_key = " + section_key);
			
				// Add the header
				if (section_key == "intro") {
					var header_html = "";
					try{
						var the_title = "Privacy Label";
                        if('title' in section){
                            the_title = section.title;
                        }
                        console.log("section.title = " + section.title);
                        header_html += '<strong class="pl-title" data-pl-i18n="title">';
                        header_html += the_title;
                        header_html += '</strong>';
                        shortcode_second_part += '-T' + base_encode(section.title);
						//else{console.log("NO TITLE??");}
						
                        if('description' in section){
                            
                            header_html += '<p class="pl-description" data-pl-i18n="description">';
                            header_html += section.description;
                            header_html += '</p>';
                            shortcode_second_part += '-D' + base_encode(section.description);
                        }
							
						header_html = '<div class="pl-intro pl-section" style="min-width:50%;padding:1rem">' + header_html + '</div>';
					
						header_html += '<div class="pl-extra pl-section" style="overflow:hidden;flex:auto"><div class="pl-responsive-pusher" style="width:400px"></div></div>';
						console.log("header html = " + header_html);
						
					}
					catch(e){self.report(e);console.log("INTRO ERROR");}
					generated_html += '<div class="pl-row pl-header" style="width:100%;display:flex;flex-wrap:wrap">' + header_html + '</div>';
				}
				
				
				
				
				// Add the footer
				else if (section_key == "updated") {
					
					var updated_year = '0000';
					var updated_month = '00';
					var updated_day = '00';
					try{
						
						if( 'updated_year' in section && 'updated_month' in section && 'updated_day' in section ){
							updated_year = String(section['updated_year']);
							updated_month = String(section['updated_month']);
							updated_day = String(section['updated_day']);
							console.log("updated day = " + updated_day);
						}
						generated_shortcode = self.language + generated_shortcode + updated_year.slice(-2) + updated_month + updated_day + 'Z';
					}
					catch(e){self.report(e);}
					try{
						generated_html += '<div class="pl-row pl-footer" style="width:100%;display:flex;flex-wrap:wrap;border-top:1px solid">';
						generated_html += '<div class="pl-updated pl-section" style="min-width:250px;flex: 1 1 0;padding:1rem;text-align:left;">';
						generated_html += '<span class="pl-updated-prefix" data-pl-i18n="last_updated">' + plTranslate('last_updated') + '</span><span class="pl-space"> </span>';
						generated_html += '<span class="pl-updated-year" data-pl-i18n="updated_year">' + updated_year + '</span><span class="pl-dash">-</span>';
						generated_html += '<span class="pl-updated-month" data-pl-i18n="updated_month">' + updated_month + '</span><span class="pl-dash">-</span>';
						generated_html += '<span class="pl-updated-day" data-pl-i18n="updated_day">' + updated_day + '</span>';
						generated_html += '</div><div class="pl-version pl-section" style="min-width:250px;flex: 1 1 0;padding:1rem;text-align:left;">';
						
                        if(self.allow_link_to_privacylabel_website){
				            generated_html += '<a class="pl-version-link" target="_blank" href="https://www.privacylabel.org/code?' + generated_shortcode + '"><span class="pl-privacylabel">Privacy Label</span></a>';
                        }
                        else{
                            generated_html += '<span class="pl-privacylabel">Privacy Label</span>';
                        }
                        generated_html += '<span class="pl-space"> </span><span class="pl-version-prefix" data-pl-i18n="version">' + plTranslate("version") + '</span><span class="pl-space"> </span><span class="pl-version-year" data-pl-i18n="version_year">';
						generated_html += privacylabel.version_year;
						generated_html += '</span><span class="pl-dash">-</span><span class="pl-version-month" data-pl-i18n="version_month">';
						generated_html += privacylabel.version_month;
						generated_html += '</span><span class="pl-space"> </span><span class="pl-version-info" data-pl-i18n="version_info">';
						generated_html += privacylabel.version_info;
						generated_html += '</span>';
                        generated_html += '<span class="pl-space"> </span><span class="pl-button-json" tabindex="-1" aria-hidden="true">CODE</span>';
						generated_html += '<div class="pl-privacylabel-json" style="display:none" aria-hidden="true"><textarea>';
						generated_html += JSON.stringify(self.label_data,null,2);
						generated_html +='</textarea></div>';
						generated_html += '</div>';
						generated_html += '</div>';
					}
					catch(e){self.report(e);}
				} else {
					// Create rows and generate cell classes
					var pl_cell_classes = "";
					if (section_key == "collection" || section_key == "purpose" || section_key == "sharing") {
						row_count++;
						pl_cell_classes += " pl-river";
						generated_html += '<div class="pl-row pl-row' + row_count + '" style="width:100%;display:flex;flex-wrap:wrap;border-top:1px solid">';
					} else {
						pl_cell_classes += " pl-details";
					}
					// Start table cell
					if (section_key != "duration") {
						generated_html += '<div class="pl-' + section_key + pl_cell_classes + ' pl-section" style="min-width:250px;flex: 1 1 0;padding:1rem;text-align:left;">';
					}
					// Add section header
					generated_html += privacylabelAddSectionHeader(section_key);
					// Add data collection details
					if (section_key == "collection") {
						try{

                            for (const [item_key, item] of Object.entries(section)) { // TODO sowieso goed om dit te vervangen, want wat als er al meteen geen item is? Kan dat?
                                
                                if (item['aggregated_data'] == true || item['personal_data'] == true || item['sensitive_data'] == true) {
                                    
                                    generated_list += '<li class="pl-collection-' + item_key + plGenerateExplanationClasses(item) + ' pl-item"><span class="pl-collection-' + item_key + '-prefix" data-pl-i18n="' + item_key + '">' + plTranslate(item_key) + '</span><span class="pl-spacer">: </span>';
                                    generated_list += '<ul class="pl-collection-' + item_key + ' pl-sublist">';
                                    var punctuation_counter = 0;
                                    var punctuation_amount = 0;
                                    for (const [subitem_key, subitem] of Object.entries(item)) {
                                        if (subitem == true) {
                                            punctuation_amount++;
                                        }
                                    }
                                    generated_shortcode += get_shortcode_letter(self,item_key);
                                    //console.log("punctuation_amount: " + punctuation_amount);
                                    for (const [subitem_key, subitem] of Object.entries(item)) {
                                        if ((subitem_key == "aggregated_data" || subitem_key == "personal_data" || subitem_key == "sensitive_data") && subitem == true) {
                                            punctuation_counter++;
                                            generated_list += '<li class="pl-collection-' + item_key + '-' + subitem_key + '"><span class="pl-collection-' + item_key + '-' + subitem_key + '"  data-pl-i18n="' + subitem_key + '">';
                                            generated_list += plTranslate(subitem_key, true);
                                            generated_list += '</span>';
                                            if (punctuation_counter < punctuation_amount - 1) {
                                                generated_list += '<span class="pl-spacer-sublist pl-spacer pl-spacer-comma">, </span>';
                                            } else if (punctuation_counter < punctuation_amount) {
                                                generated_list += '<span class="pl-spacer-sublist pl-spacer pl-spacer-and"> & </span>';
                                            }
                                            generated_list += '</span></li>';
                                            generated_shortcode += get_shortcode_letter(self,subitem_key);
                                        }
                                    }
                                    generated_list += '</ul>';
                                    generated_list += privacylabelAddExplanation(item, "issuer_" + item_key); // TODO: kan er niet beter in alle gebruik van deze functie gewoon de parent opgestuurd worden? Dat de functie uitzoekt of het een issuer explanation is?
                                    generated_list += '</li>';
                                }
                            }
						}
						catch(e){self.report(e);}
                        generated_html += wrap_list(generated_list,'None')
					}
					// Add location details
					else if (section_key == "location") {
						var item_key = 'processed_outside_the_eu';
                        
						if( Object.keys ( label_data['collection']).length == 0){
							generated_html += wrap_list('','-');
						}else{
							try{
	                            if( item_key in section){
	                                var item = section[item_key];
	                                generated_list += '<li class="pl-location-item' + plGenerateExplanationClasses(item) + ' pl-item"><span class="pl-quantifier" data-pl-i18n="' + item.value + '">';
	                                generated_list += plTranslate(item.value);
	                                generated_list += '</span><span class="space"> </span><span class="pl-quantified" data-pl-i18n="' + item_key + '">';
	                                generated_list += plTranslate(item_key, true);
	                                generated_list += '</span>';
	                                generated_list += privacylabelAddExplanation(item, "issuer_location");
	                                generated_list += '</li>';
	                                if( 'value' in item ){
	                                    generated_shortcode += get_shortcode_letter(self,item.value);
	                                }
	                            }
							}
							catch(e){self.report(e);}
							generated_html += wrap_list(generated_list,'-');
						}
						
					}
					// Add duration details
					else if (section_key == "duration") {
						if( Object.keys ( label_data['collection']).length == 0){
							generated_html += wrap_list('','-');
						}else{
							try{
	                            for(var d = 0; d < Object.entries(section).length; d++){ //  TODO. De volgorde wordt zo vastgezet. Maar nu zit 4 loops ingebakken, terwijl er minder items zouden kunne zijn.
	                                item_key = duration_array[d];
	                                if( item_key in section ){
	                                    item = section[item_key];

	                                    if( 'value' in item ){
	                                        //console.log("duration item_key = " + item_key);
	                                        //console.log("duration item.value = " + item.value);
	                                        generated_list += '<li class="pl-item' + plGenerateExplanationClasses(item) + '"><span class="pl-quantifier" data-pl-i18n="' + item_key + '">';
	                                        generated_list += plTranslate(item_key);
	                                        generated_list += '</span><span class="pl-spacer">: </span><span class="pl-quantified" data-pl-i18n="' + item.value + '">';
	                                        generated_list += plTranslate(item.value, true);
	                                        generated_list += '</span>';
	                                        generated_list += privacylabelAddExplanation(item, "issuer_" + item_key); // TODO of toch liever item.quantifier?
	                                        generated_list += '</li>';
	                                        generated_shortcode += get_shortcode_letter(self,item.value);
	                                    }
	                                }
	                            }
							}
							catch(e){self.report(e);}
	                        generated_html += wrap_list(generated_list, '');
						}
					}
					// Add purpose, legal and sharing lists
					else if (section_key == "purpose" || section_key == "legal" || section_key == "sharing") {
						//console.log("__" + section_key);
                        try{
							
                            for (const [item_key, item] of Object.entries(section)) { // TODO Veel soorten object class in gebruik. ECMA 5 voor nodig, wat het niet erg compatible maakt.
                                var item_key_short = plShortener(item_key); // Create short css class name
                                //console.log("item_key = " + item_key);
                                var explanation_classes = plGenerateExplanationClasses(item);
                                generated_list += '<li class="pl-item' + plGenerateExplanationClasses(item) + '">';
                                generated_list += '<span class="pl-' + section_key + '-' + item_key_short + '-name" data-pl-i18n="' + item_key + '">' + plTranslate(item_key) + '</span>';
                                generated_list += privacylabelAddExplanation(item, "issuer_" + item_key_short);
                                generated_list += '</li>';
                                generated_shortcode += get_shortcode_letter(self,item_key);
                            }
						}
						catch(e){self.report(e);}
                        var none_message = 'None';
                        if(section_key == "legal"){none_message = '-'}
				        generated_html += wrap_list(generated_list, none_message);
					}
					// Add action
					else if (section_key == "action") {
						try{
							if ('privacy_policy' in section && section.privacy_policy != "") {
								shortcode_second_part += '-R' + base_encode(section.privacy_policy);
								generated_list += '<li class="pl-privacy-policy"><a href="' + section.privacy_policy + '" data-pl-i18n="read_our_privacy_policy">' + plTranslate("read_our_privacy_policy") + '</a></li>';
							}
							if ('manage_data' in section && section.manage_data != "") {
								shortcode_second_part += '-M' + base_encode(section.manage_data);
								generated_list += '<li class="pl-manage_data"><a href="' + section.manage_data + '" data-pl-i18n="manage_your_data">' + plTranslate("manage_your_data") + '</a></li>';
							}
							if ('contact' in section && section.contact != "") {
								shortcode_second_part += '-C' + base_encode(section.contact);
								generated_list += '<li class="pl-contact"><a href="' + section.contact + '" data-pl-i18n="contact_our_privacy_officer">' + plTranslate("contact_our_privacy_officer") + '</a></li>';
							}
							if ('email' in section && section.email != "") {
								shortcode_second_part += '-E' + base_encode(section.email);
								generated_list += '<li class="pl-email"><a class="pl-printable" href="mailto:' + section.email + '"><span class="pl-action-prefix" data-pl-i18n="email">' + plTranslate('email') + '</span><span class="pl-spacer">: </span><span class="pl-email-address">' + section.email + '</span></a></li>';
							}
							if ('phone' in section && section.phone != "") {
								shortcode_second_part += '-P' + base_encode(section.phone);
								generated_list += '<li class="pl-phone"><a class="pl-printable" href="tel:' + section.phone + '"><span class="pl-action-prefix" data-pl-i18n="phone">' + plTranslate('phone') + '</span><span class="pl-spacer">: </span><span class="pl-phone-number">' + section.phone + '</span></a></li>';
							}
						}
						catch(e){self.report(e);}
                        generated_html += wrap_list(generated_list, '-');
					}
					// Close section
					if (section_key != "location") {
						generated_html += '</div>';
					}
					// Close the row
					if (section_key == "duration" || section_key == "legal" || section_key == "action") {
						generated_html += '</div>';
					}
				}
			}
			generated_html += '<div>'; // End of .privacylabel
			

            // Place html inside target element
            console.log("target element is currently: " + self.target);

            try {
                var target = document.getElementById(self.target);
                //console.log("label_target_element is now: " + target);
                if (typeof target === 'object') {
                    target.innerHTML = generated_html;
                } else {
                    console.log("failed to get the target element");
                }
                //document.getElementById("debug_output").innerHTML = JSON.stringify(label_data, null, 2);
            }catch(e){
                console.log("Error trying to get target element by ID, will try class instead");
                try {
                    var targets = document.getElementsByClassName(self.target);  // Find the elements
                        for(var f = 0; f < targets.length; f++){
                        targets[f].innerHTML = generated_html;
                    }
                }catch(f){report("Could not insert HTML: " + f);}
            }

            self.shorter_code = generated_shortcode;
            self.short_code = generated_shortcode + shortcode_second_part;	
		}
	};
	
	Privacylabel.init = function(desired_target, desired_language, desired_label_object) {
		var self = this;
        self.debug = true;
		self.report("debug test");
		self.target = 'privacylabel-container';
		self.language = null;
        self.shorter_code = null;
        self.short_code = null;
        self.embed_html = null;
		self.allow_link_to_privacylabel_website = true;
		self.desired_target = 'privacylabel-container';
		self.translations = null;
		self.label_data = null;
		self.download_queue = 0;
		

		try {
			self.translations = window.privacylabel_languages;
			self.report("Loaded translations: " + JSON.stringify(self.translations));
		} catch (e) {
			self.report("Could not load translations data");
		}
		
		if(desired_target !== undefined){
			self.setTarget(desired_target);
		}
		if(desired_language !== undefined){
			self.setLanguage(desired_language);
		}
		if(desired_label_object !== undefined){
			self.loadLabelObject(desired_label_object);
		}

	}
	// trick borrowed from jQuery so we don't have to use the 'new' keyword
	Privacylabel.init.prototype = Privacylabel.prototype;
	// attach our Privacylabel to the global object, and provide shorthand 'PL$' for ease of use
	global.Privacylabel = Privacylabel;
})(window);