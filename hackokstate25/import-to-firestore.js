/**
 * Firestore Import Script
 * Imports dining-locations.json into Firestore
 * 
 * Prerequisites:
 * 1. Install Firebase Admin SDK: npm install firebase-admin
 * 2. Download service account key from Firebase Console:
 *    - Project Settings > Service Accounts > Generate New Private Key
 *    - Save as 'service-account-key.json' in project root
 * 3. Update COLLECTION_NAME if your app uses a different collection name
 */

const admin = require('firebase-admin');
const fs = require('fs');

// Collection name - must match your app code
const COLLECTION_NAME = 'dininglocations'; // lowercase to match your app

// Initialize Firebase Admin
function initFirebase() {
    try {
        const serviceAccount = require('./service-account-key.json');

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log('✅ Firebase Admin initialized');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin:', error.message);
        console.log('\n💡 Make sure you have:');
        console.log('   1. Installed firebase-admin: npm install firebase-admin');
        console.log('   2. Created service-account-key.json from Firebase Console');
        return false;
    }
}

// Import locations to Firestore
async function importLocations() {
    try {
        // Read the JSON file
        if (!fs.existsSync('./dining-locations.json')) {
            console.error('❌ dining-locations.json not found!');
            console.log('💡 Run scraper.js first to generate the data file.');
            process.exit(1);
        }

        const locations = JSON.parse(fs.readFileSync('./dining-locations.json', 'utf8'));
        console.log(`\n📦 Found ${locations.length} locations to import`);

        const db = admin.firestore();
        let successCount = 0;
        let errorCount = 0;

        // Process in batches (Firestore batch limit is 500)
        const batchSize = 500;

        for (let i = 0; i < locations.length; i += batchSize) {
            const batch = db.batch();
            const batchLocations = locations.slice(i, i + batchSize);

            console.log(`\n📝 Processing batch ${Math.floor(i / batchSize) + 1} (${batchLocations.length} locations)...`);

            batchLocations.forEach((location, index) => {
                try {
                    // Skip invalid entries
                    if (!location.name ||
                        location.name === 'Locations' ||
                        !location.coordinates ||
                        !location.coordinates.lat ||
                        !location.coordinates.lng) {
                        console.log(`⚠️  Skipping invalid location: ${location.name || 'Unknown'}`);
                        return;
                    }

                    // Use location name as document ID (sanitized)
                    const docId = location.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '');

                    if (!docId || docId.length === 0) {
                        console.log(`⚠️  Skipping location with invalid name: ${location.name}`);
                        return;
                    }

                    const ref = db.collection(COLLECTION_NAME).doc(docId);

                    // Prepare data with proper types - include all scraped fields
                    const firestoreData = {
                        name: location.name,
                        building: location.building || '',
                        coordinates: {
                            lat: typeof location.coordinates?.lat === 'number'
                                ? location.coordinates.lat
                                : parseFloat(location.coordinates?.lat) || 36.1285,
                            lng: typeof location.coordinates?.lng === 'number'
                                ? location.coordinates.lng
                                : parseFloat(location.coordinates?.lng) || -97.0673
                        },
                        status: location.status || 'open',
                        crowdLevel: typeof location.crowdLevel === 'number'
                            ? location.crowdLevel
                            : parseInt(location.crowdLevel) || 50,
                        officialMenu: Array.isArray(location.officialMenu)
                            ? location.officialMenu.filter(item => item && item.trim() !== '&nbsp;')
                            : [],
                        liveMenu: Array.isArray(location.liveMenu) ? location.liveMenu : [],
                    };

                    // Add all optional fields from scraped data
                    if (location.description && location.description.trim()) {
                        firestoreData.description = location.description.trim();
                    }
                    if (location.url) firestoreData.url = location.url;
                    if (location.mapLink) firestoreData.mapLink = location.mapLink;
                    if (location.hasGrubhub !== undefined) firestoreData.hasGrubhub = location.hasGrubhub;
                    if (Array.isArray(location.cuisine) && location.cuisine.length > 0) {
                        firestoreData.cuisine = location.cuisine.filter(item => item && item.trim() !== '&nbsp;');
                    }
                    if (Array.isArray(location.hours) && location.hours.length > 0) {
                        firestoreData.hours = location.hours;
                    }
                    if (location.detailedMenu && Object.keys(location.detailedMenu).length > 0) {
                        firestoreData.detailedMenu = location.detailedMenu;
                    }

                    batch.set(ref, firestoreData, { merge: true });

                    if ((index + 1) % 10 === 0) {
                        process.stdout.write('.');
                    }
                } catch (error) {
                    console.error(`\n⚠️  Error preparing location ${location.name}:`, error.message);
                    errorCount++;
                }
            });

            // Commit batch
            try {
                await batch.commit();
                successCount += batchLocations.length;
                console.log(` ✅ Batch committed successfully`);
            } catch (error) {
                console.error(`\n❌ Error committing batch:`, error.message);
                errorCount += batchLocations.length;
            }
        }

        console.log('\n\n📊 Import Summary:');
        console.log(`   ✅ Successfully imported: ${successCount} locations`);
        console.log(`   ❌ Failed: ${errorCount} locations`);
        console.log(`   📁 Collection: ${COLLECTION_NAME}`);

        if (successCount > 0) {
            console.log('\n🎉 Import complete! Check your Firestore console to verify.');
        }

    } catch (error) {
        console.error('\n❌ Import failed:', error);
        process.exit(1);
    }
}

// Main execution
async function main() {
    console.log('🔥 Firestore Import Script');
    console.log('==========================\n');

    if (!initFirebase()) {
        process.exit(1);
    }

    await importLocations();

    // Clean up
    admin.app().delete();
    process.exit(0);
}

// Run the import
main();

