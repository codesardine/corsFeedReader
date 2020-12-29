class CorsFeedReader {

    constructor(container, fetchOptions, userOptions) {
        this.itemContainer = container
        this.fetchOptions = fetchOptions
        this.setOptions(userOptions)
        this.main()
    }

    setOptions(userOptions) {
        let defaults = {
            dev: false,
            feedUrl: "",
            items: 0,
            beforeTemplate: function(){console.log("beforeTemplate not set")},
            afterTemplate: function(){console.log("afterTemplate not set")},
            template: `
            <div class="feed-item {{ category }}">
              <a href="{{ link }}">
                  <h2>{{ title }}</h2>
                </a>
              <summary class="description">
                {{ pubDate }} <br>
                {{ description }}
              </summary>
            `}
        for (let property in userOptions) {
            defaults[property] = userOptions[property]
        }
        this.options = defaults
    }

    main() {
        fetch(this.options.feedUrl, this.fetchOptions)
        .then(data => this.handleResponse(data))
        .catch(error => console.log(error))
    }

    handleResponse (response) {
    let contentType = response.headers.get('content-type')
    if (contentType.includes('application/rss+xml')) {
        this.handleFeedResponse(response)
    } else {
        throw new Error(`content-type:${contentType} not supported`)
      }
    }

    handleFeedResponse (response) {
    response.text()
        .then(data => {
        if (response.ok) {
            this.parseItems(data)
        } else {
            return Promise.reject({
            status: response.status,
            statusText: response.statusText,
            err: data
            })
        }
        })
    }

    parseItems (data) {
        let domParser = new DOMParser()
        let doc = domParser.parseFromString(data, 'text/xml')
        const feed = doc.querySelectorAll('item')
        if (this.options.items == 0) {
            this.options.items = feed.length
            var items = this.options.items
        } else {
            this.options.items--
            var items = this.options.items + 1

        }
        console.log(`Processing ${items} items out of ${feed.length} in the feed`)
        if (this.options.dev) { console.log(feed); } 
        let thisObj = this  

        feed.forEach( function (item, index) {
            if (index < items) {
                let content = {}
                item.childNodes.forEach(child => {
                    child = child.nodeName
                    try {
                        if (!child.startsWith("#")&&child.indexOf(":") === -1) {
                            content[child] = item.querySelector(child)
                        }
                    }
                    catch(error) {
                        console.log(error.message);
                      }                      
                })
                thisObj.template(content)
                if (thisObj.options.dev) { console.log(content); }
            }            
        })
        console.log("URL:", this.options.feedUrl, " processed.");
    }

    template (content) {
        this.beforeTemplate(content)
        let template = this.options.template
            for (let key in content) {
                let re = new RegExp(`{{ ${key} }}`, "g")
                if (typeof content[key] === "string") {
                    template = template.replace(re, content[key])
                } else {
                    template = template.replace(re, content[key].textContent)
                }
                                    
            }
        this.templateOutput(template)
    }

    templateOutput(template) {
        let container = document.querySelector(this.itemContainer)
        container.insertAdjacentHTML('beforeend', template)
        this.afterTemplate(content)
    }

    beforeTemplate(content) {
        return this.options.beforeTemplate(content)        
    }

    afterTemplate(content) {
        return this.options.afterTemplate(content)        
    }
}
