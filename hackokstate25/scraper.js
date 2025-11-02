/**
 * Enhanced OSU Dining Locations Scraper
 * Scrapes:
 * 1. Main locations page for all locations
 * 2. Individual location pages for detailed menus
 * 3. Hours page for operating hours
 */

const https = require('https');
const fs = require('fs');

// Approximate coordinates for OSU campus buildings
const LOCATION_COORDINATES = {
    'Adams Market': { lat: 36.1285, lng: -97.0673 },
    'Bennett Hall': { lat: 36.1260, lng: -97.0680 },
    'Central Market Place': { lat: 36.1300, lng: -97.0650 },
    'North Dining': { lat: 36.1285, lng: -97.0673 },
    'Student Union': { lat: 36.1250, lng: -97.0650 },
    'Larry & Kay\'s Dairy Bar': { lat: 36.1250, lng: -97.0680 },
    'Café Libro': { lat: 36.1250, lng: -97.0650 }, // Edmon Low Library
    'Barkin\' Brews': { lat: 36.1300, lng: -97.0700 },
    'Agricultural Hall': { lat: 36.1250, lng: -97.0680 }, // Dairy Bar location
    'McElroy Hall': { lat: 36.1300, lng: -97.0700 }, // Barkin' Brews location
};

function fetchHTML(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + (urlObj.search || ''),
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302) {
                    resolve(data);
                } else {
                    reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Parse main locations page
function parseMainLocationsPage(html) {
    const locations = [];

    html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    const sections = html.split(/(?=<h2[^>]*>)/);

    sections.forEach((section) => {
        const h2Match = section.match(/<h2[^>]*>([^<]+)<\/h2>/);
        if (!h2Match) return;

        const locationName = h2Match[1].trim();

        if (locationName === 'Our Locations' ||
            locationName === "We're Serious About Food." ||
            locationName === 'Dining Hours') {
            return;
        }

        const descMatch = section.match(/<p[^>]*>([^<]+(?:<em[^>]*>.*?<\/em>)?[^<]*)<\/p>/);
        let description = '';
        if (descMatch) {
            description = descMatch[1]
                .replace(/<em[^>]*>/g, '')
                .replace(/<\/em>/g, '')
                .replace(/&nbsp;/g, ' ')
                .trim();
        }

        const concepts = [];
        const linkPattern = /<a[^>]*href=["']([^"']*\/locations\/[^"']+\.html)["'][^>]*>([^<]+)<\/a>/gi;
        let linkMatch;

        while ((linkMatch = linkPattern.exec(section)) !== null) {
            const conceptUrl = linkMatch[1];
            let conceptName = linkMatch[2].trim();

            conceptName = conceptName.replace(/&amp;/g, '&').replace(/&quot;/g, '"');

            const afterLink = section.substring(linkMatch.index + linkMatch[0].length);
            const pMatch = afterLink.match(/<p[^>]*>([^<]+)<\/p>/);
            let conceptDesc = '';

            if (pMatch) {
                conceptDesc = pMatch[1]
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .trim();
            }

            if (!concepts.find(c => c.name === conceptName)) {
                concepts.push({
                    name: conceptName,
                    url: conceptUrl,
                    description: conceptDesc
                });
            }
        }

        let coords = LOCATION_COORDINATES[locationName] ||
            LOCATION_COORDINATES[locationName.replace(/&amp;/g, '&')];

        if (!coords) {
            if (description.includes('Hall of Fame') && description.includes('Monroe')) {
                coords = { lat: 36.1285, lng: -97.0673 };
            } else if (description.includes('Farm Road')) {
                coords = { lat: 36.1300, lng: -97.0650 };
            } else if (description.includes('University Avenue') && description.includes('Hester')) {
                coords = { lat: 36.1250, lng: -97.0650 };
            } else {
                coords = { lat: 36.1285, lng: -97.0673 };
            }
        }

        if (concepts.length > 0 ||
            locationName.includes('Market') ||
            locationName.includes('Dining') ||
            locationName.includes('Dairy Bar') ||
            locationName.includes('Café') ||
            locationName.includes('Brews')) {

            locations.push({
                building: locationName,
                description: description,
                concepts: concepts,
                coordinates: coords
            });
        }
    });

    return locations;
}

// Parse individual location page for detailed info
async function scrapeLocationPage(baseUrl, locationUrl) {
    try {
        let fullUrl = locationUrl.startsWith('http') ? locationUrl : baseUrl + locationUrl;
        if (!fullUrl.includes('dining.okstate.edu')) {
            fullUrl = 'https://dining.okstate.edu' + (locationUrl.startsWith('/') ? locationUrl : '/' + locationUrl);
        }

        const html = await fetchHTML(fullUrl);

        const details = {
            cuisine: [],
            hasGrubhub: false,
            mapLink: null,
            detailedMenu: {},
            fullDescription: ''
        };

        // Extract cuisine types
        const cuisineMatch = html.match(/<strong[^>]*>Cuisine<\/strong>[\s\S]*?<p[^>]*>([^<]+)<\/p>/i);
        if (cuisineMatch) {
            const cuisineText = cuisineMatch[1].trim();
            details.cuisine = cuisineText.split(/\s+/).filter(w => w.length > 0);
        }

        // Check for Grubhub
        if (html.includes('Grubhub') || html.includes('grubhub')) {
            details.hasGrubhub = true;
        }

        // Extract map link
        const mapMatch = html.match(/<a[^>]*href=["']([^"']*map[^"']*)["'][^>]*>.*?Map It/i);
        if (mapMatch) {
            details.mapLink = mapMatch[1];
        }

        // Extract full description
        const descMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>[\s\S]*?<p[^>]*>([^<]+)<\/p>/i);
        if (descMatch && descMatch[2]) {
            details.fullDescription = descMatch[2].trim();
        }

        // Extract detailed menu structure
        const menuSection = html.match(/<h2[^>]*>Menu<\/h2>([\s\S]*?)(?=<h[12]|<\/main|<\/body|$)/i);
        if (menuSection) {
            const menuHtml = menuSection[1];

            // Extract menu categories (h3 headings)
            const h3Matches = [...menuHtml.matchAll(/<h3[^>]*>/gi)];
            const categories = {};

            for (let i = 0; i < h3Matches.length; i++) {
                const match = h3Matches[i];
                const categoryStart = match.index;
                const categoryEnd = i < h3Matches.length - 1 ?
                    h3Matches[i + 1].index :
                    menuHtml.length;

                // Extract category name
                const categoryNameMatch = menuHtml.substring(categoryStart).match(/<h3[^>]*>([^<]+)<\/h3>/i);
                if (!categoryNameMatch) continue;

                const categoryName = categoryNameMatch[1].trim();
                const categoryContent = menuHtml.substring(categoryStart + categoryNameMatch[0].length, categoryEnd);

                // Extract subsections (strong tags with lists following)
                const subsections = {};
                const allStrongMatches = [...categoryContent.matchAll(/<strong[^>]*>([^<]+)<\/strong>/gi)];

                allStrongMatches.forEach((strongMatch, strongIdx) => {
                    const subsectionName = strongMatch[1].trim();
                    const matchStart = strongMatch.index;
                    const matchLength = strongMatch[0].length;
                    const nextStrong = allStrongMatches[strongIdx + 1];
                    const subsectionEnd = nextStrong ? nextStrong.index : categoryContent.length;

                    const subsectionContent = categoryContent.substring(matchStart + matchLength, subsectionEnd);

                    // Find list items in this subsection
                    const listItems = [...subsectionContent.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
                    if (listItems.length > 0) {
                        const items = listItems.map(item => {
                            return item[1]
                                .replace(/<[^>]+>/g, '')
                                .replace(/&nbsp;/g, ' ')
                                .replace(/&amp;/g, '&')
                                .trim();
                        }).filter(item => item.length > 0);

                        if (items.length > 0) {
                            subsections[subsectionName] = items;
                        }
                    }
                });

                // Also get direct list items not under strong tags
                if (Object.keys(subsections).length === 0) {
                    const directItems = [...categoryContent.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
                        .map(m => {
                            return m[1]
                                .replace(/<[^>]+>/g, '')
                                .replace(/&nbsp;/g, ' ')
                                .replace(/&amp;/g, '&')
                                .trim();
                        })
                        .filter(item => item.length > 0 && !item.match(/^<strong>/));

                    if (directItems.length > 0) {
                        subsections['Items'] = directItems;
                    }
                }

                if (Object.keys(subsections).length > 0) {
                    categories[categoryName] = subsections;
                }
            }

            if (Object.keys(categories).length > 0) {
                details.detailedMenu = categories;
            }
        }

        return details;
    } catch (error) {
        console.warn(`  ⚠️  Warning: Could not scrape ${locationUrl}: ${error.message}`);
        return null;
    }
}

// Parse hours page
function parseHoursPage(html) {
    const hours = {};

    // Remove scripts and styles
    html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Extract tables (each building has a table with hours)
    const tableMatches = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)];

    tableMatches.forEach(tableMatch => {
        const tableHtml = tableMatch[1];

        // Find concept name in the table - look for links with concept names
        const conceptLinks = [...tableHtml.matchAll(/<a[^>]*href=["']\/locations\/([^"']+)\.html["'][^>]*>[\s\S]*?<strong[^>]*>([^<]+)<\/strong>/gi)];

        conceptLinks.forEach((linkMatch, linkIndex) => {
            const conceptUrl = linkMatch[1];
            let conceptName = linkMatch[2].trim().toUpperCase();

            // Clean up concept name
            conceptName = conceptName.replace(/&AMP;/gi, '&').replace(/&amp;/gi, '&');

            // Extract hours rows after the concept link row
            // Find the position after this link's row
            const linkRowStart = tableHtml.substring(0, linkMatch.index).lastIndexOf('<tr');
            const nextConceptLink = conceptLinks[linkIndex + 1];
            const linkRowEnd = nextConceptLink ?
                tableHtml.substring(0, nextConceptLink.index).lastIndexOf('<tr') :
                tableHtml.length;

            const sectionHtml = tableHtml.substring(linkRowStart, linkRowEnd);

            // Extract hour rows
            // Get all table rows in this section
            const allRows = [...sectionHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

            const hoursList = [];
            allRows.forEach((rowMatch) => {
                const rowHtml = rowMatch[1];

                // Skip rows that contain the concept link (the header row for this concept)
                if (rowHtml.includes('/locations/') && rowHtml.includes('<strong>')) {
                    return;
                }

                // Skip header rows with "Concept" and "Hours of Operation"
                if (rowHtml.includes('Concept') && rowHtml.includes('Hours of Operation')) {
                    return;
                }

                // Extract all cells in this row
                const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];

                if (cells.length >= 2) {
                    // Clean up cell content - remove HTML tags and decode entities
                    let day = cells[0][1]
                        .replace(/<[^>]+>/g, '')
                        .replace(/&nbsp;/gi, ' ')
                        .replace(/&amp;/gi, '&')
                        .replace(/&lt;/gi, '<')
                        .replace(/&gt;/gi, '>')
                        .replace(/&quot;/gi, '"')
                        .trim();

                    let time = cells[1][1]
                        .replace(/<[^>]+>/g, '')
                        .replace(/&nbsp;/gi, ' ')
                        .replace(/&amp;/gi, '&')
                        .replace(/&lt;/gi, '<')
                        .replace(/&gt;/gi, '>')
                        .replace(/&quot;/gi, '"')
                        .trim();

                    // If first cell is empty/&nbsp and second cell has a day name, they might be swapped
                    // Or the structure might be: empty cell | day name (then next row has the time)
                    // But based on the HTML structure, it should be: day | time

                    // Filter out invalid rows
                    if (!day || day === '' || /^[\s&;]*$/.test(day)) {
                        return;
                    }

                    if (!time || time === '' || /^[\s&;]*$/.test(time)) {
                        return;
                    }

                    const dayUpper = day.toUpperCase();
                    const timeUpper = time.toUpperCase();

                    // Skip header rows
                    if (dayUpper.includes('CONCEPT') || timeUpper.includes('HOURS') || timeUpper.includes('OPERATION')) {
                        return;
                    }

                    // Skip rows where day looks like a time (contains "a.m." or "p.m.")
                    if (/[0-9]\s*(a\.?m\.?|p\.?m\.?)/i.test(day) && !/[0-9]\s*(a\.?m\.?|p\.?m\.?)/i.test(time)) {
                        // Likely swapped - swap them back
                        const temp = day;
                        day = time;
                        time = temp;
                    }

                    // Valid hour entry - day should contain weekday names or "Daily", time should contain times
                    const weekdayPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Daily|Weekday|Weekend|Closed)/i;
                    const timePattern = /([0-9]|a\.?m\.?|p\.?m\.?|Closed)/i;

                    // Day should match weekday pattern, time should match time pattern
                    const dayIsValid = weekdayPattern.test(day);
                    const timeIsValid = timePattern.test(time);

                    if (dayIsValid && timeIsValid && day.length < 50) {
                        hoursList.push({
                            day: day,
                            hours: time
                        });
                    }
                }
            });

            if (hoursList.length > 0) {
                // Store hours with multiple keys for easier lookup
                hours[conceptName] = hoursList;

                // Also store with URL as key
                const urlKey = conceptUrl.replace(/\.html$/, '').replace(/-/g, ' ').toUpperCase();
                if (urlKey !== conceptName) {
                    hours[urlKey] = hoursList;
                }

                // Store with original case variations
                const variations = [
                    conceptName.replace(/\s+/g, ' '),
                    conceptName.replace(/[,\.]/g, ''),
                    conceptName.replace(/&/g, 'AND')
                ];

                variations.forEach(variation => {
                    if (variation !== conceptName && !hours[variation]) {
                        hours[variation] = hoursList;
                    }
                });
            }
        });
    });

    return hours;
}

// Extract menu items from description and detailed menu
function extractMenuItems(description, detailedMenu, cuisine = []) {
    const menuItems = [];
    const lowerDesc = description ? description.toLowerCase() : '';

    // Add cuisine types
    cuisine.forEach(c => {
        if (c && !menuItems.includes(c)) {
            menuItems.push(c);
        }
    });

    // Keyword mapping
    const keywordMap = {
        'pizza': 'Pizza',
        'burgers': 'Burgers',
        'salads': 'Salads',
        'sandwiches': 'Sandwiches',
        'coffee': 'Coffee',
        'starbucks': 'Starbucks Coffee',
        'chicken': 'Chicken',
        'nuggets': 'Chicken Nuggets',
        'waffle fries': 'Waffle Fries',
        'fries': 'Fries',
        'pasta': 'Pasta',
        'calzones': 'Calzones',
        'smoothies': 'Smoothies',
        'cookies': 'Cookies',
        'ice cream': 'Ice Cream',
        'milkshakes': 'Milkshakes',
        'milk shakes': 'Milkshakes',
        'breakfast': 'Breakfast',
        'lunch': 'Lunch',
        'sushi': 'Sushi',
        'deli': 'Deli',
        'grill': 'Grill',
        'bakery': 'Bakery',
        'soup': 'Soup',
        'tomato soup': 'Tomato Soup',
        'tacos': 'Tacos',
        'noodles': 'Noodles',
        'wings': 'Wings',
        'boneless wings': 'Boneless Wings',
        'mac and cheese': 'Mac and Cheese',
        'mac & cheese': 'Mac and Cheese',
        'vegan': 'Vegan Options',
        'vegetarian': 'Vegetarian Options',
        'gluten-friendly': 'Gluten-Friendly',
        'allergen-friendly': 'Allergen-Friendly',
        'gourmet': 'Gourmet',
        'grab-and-go': 'Grab-and-Go',
        'snacks': 'Snacks',
        'beverages': 'Beverages',
        'frozen custard': 'Frozen Custard',
        'queso': 'Queso',
        'guacamole': 'Guacamole',
        'nachos': 'Nachos',
        'chips and salsa': 'Chips and Salsa',
        'bowl-ritos': 'Bowl-ritos',
        'mediterranean': 'Mediterranean',
        'grocery': 'Grocery Items',
        'necessities': 'Campus Necessities',
        'grilled cheese': 'Grilled Cheese',
        'homestyle': 'Homestyle',
        'local ingredients': 'Local Ingredients',
        'meal replacement shakes': 'Meal Replacement Shakes',
        'cold-brew': 'Cold-Brew Coffee',
        'hand-carved meats': 'Hand-Carved Meats',
        'gourmet sides': 'Gourmet Sides'
    };

    Object.keys(keywordMap).forEach(keyword => {
        if (lowerDesc.includes(keyword)) {
            const item = keywordMap[keyword];
            if (!menuItems.includes(item)) {
                menuItems.push(item);
            }
        }
    });

    // Extract from detailed menu categories
    if (detailedMenu && Object.keys(detailedMenu).length > 0) {
        Object.keys(detailedMenu).forEach(category => {
            // Use category name as menu item (capitalize first letter)
            const categoryItem = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
            if (!menuItems.includes(categoryItem) && categoryItem.length > 2) {
                menuItems.push(categoryItem);
            }
        });
    }

    return menuItems.length > 0 ? menuItems : ['Various options'];
}

async function scrape() {
    try {
        console.log('🍽️  OSU Dining Locations Scraper\n');

        // Step 1: Get main locations page
        console.log('📋 Step 1: Fetching main locations page...');
        const mainHtml = await fetchHTML('https://dining.okstate.edu/locations/');
        const locations = parseMainLocationsPage(mainHtml);

        console.log(`✅ Found ${locations.length} location buildings with ${locations.reduce((sum, loc) => sum + loc.concepts.length, 0)} total concepts`);

        // Step 2: Get hours
        console.log('\n🕐 Step 2: Fetching hours page...');
        const hoursHtml = await fetchHTML('https://dining.okstate.edu/hours/fall-hours.html');
        const allHours = parseHoursPage(hoursHtml);
        console.log(`✅ Found hours for ${Object.keys(allHours).length} concepts`);

        // Step 3: Scrape individual location pages
        console.log('\n📄 Step 3: Scraping individual location pages for detailed info...');
        const baseUrl = 'https://dining.okstate.edu';
        const firestoreData = [];

        for (const location of locations) {
            for (const concept of location.concepts) {
                console.log(`  📍 Scraping ${concept.name}...`);

                const details = await scrapeLocationPage(baseUrl, concept.url);

                // Find hours for this concept (try multiple name variations)
                const conceptNameUpper = concept.name.toUpperCase();
                const urlBase = concept.url.replace(/\.html$/, '').replace(/-/g, ' ').toUpperCase();

                const conceptHours = allHours[conceptNameUpper] ||
                    allHours[urlBase] ||
                    allHours[concept.name.toUpperCase().replace(/[,\.]/g, '')] ||
                    allHours[conceptNameUpper.replace(/&/g, 'AND')] ||
                    allHours[conceptNameUpper.replace(/\s+/g, ' ')] ||
                    [];

                // Extract menu items
                const menuItems = extractMenuItems(
                    concept.description,
                    details?.detailedMenu || {},
                    details?.cuisine || []
                );

                // Create Firestore entry
                const entry = {
                    name: concept.name,
                    building: location.building,
                    coordinates: location.coordinates,
                    status: 'open',
                    crowdLevel: Math.floor(Math.random() * 100),
                    officialMenu: menuItems,
                    liveMenu: [],
                    description: details?.fullDescription || concept.description,
                    url: concept.url,
                };

                // Add optional fields
                if (details) {
                    if (details.cuisine && details.cuisine.length > 0) {
                        entry.cuisine = details.cuisine;
                    }
                    if (details.hasGrubhub) {
                        entry.hasGrubhub = true;
                    }
                    if (details.mapLink) {
                        entry.mapLink = details.mapLink;
                    }
                    if (Object.keys(details.detailedMenu || {}).length > 0) {
                        entry.detailedMenu = details.detailedMenu;
                    }
                }

                if (conceptHours.length > 0) {
                    entry.hours = conceptHours;
                }

                firestoreData.push(entry);

                // Small delay to be respectful
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log(`\n✅ Scraped ${firestoreData.length} dining locations`);

        // Save to JSON
        const outputFile = 'dining-locations.json';
        fs.writeFileSync(outputFile, JSON.stringify(firestoreData, null, 2));

        console.log(`\n💾 Data saved to ${outputFile}`);
        console.log(`\n📊 Sample entry:`);
        console.log(JSON.stringify(firestoreData.find(e => e.name === 'Bread & Beyond Deli') || firestoreData[0], null, 2));

        // Create summary
        const summary = {
            totalLocations: firestoreData.length,
            buildings: [...new Set(firestoreData.map(l => l.building))],
            scrapeDate: new Date().toISOString(),
            locations: firestoreData.map(l => ({
                name: l.name,
                building: l.building,
                coordinates: l.coordinates,
                hasHours: !!l.hours,
                hasDetailedMenu: !!l.detailedMenu,
                hasGrubhub: !!l.hasGrubhub
            }))
        };

        fs.writeFileSync('dining-locations-summary.json', JSON.stringify(summary, null, 2));
        console.log('\n📊 Summary saved to dining-locations-summary.json');
        console.log('\n✨ Scraping complete!');

    } catch (error) {
        console.error('❌ Error scraping:', error);
        process.exit(1);
    }
}

// Run the scraper
scrape();
