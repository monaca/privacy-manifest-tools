const fs = require('fs');
const path = require('path');
const util = require('util');
const f = util.format;

// const pbxprojPath = 'ios/App/App.xcodeproj/project.pbxproj';
// const privacyManifestPath = './PrivacyInfo.xcprivacy';

// addPrivacyManifest(pbxprojPath, privacyManifestPath);

function addPrivacyManifest(pbxprojPath, privacyManifestPath) {
    const xcode = require('xcode');
    const proj = xcode.project(pbxprojPath);
    
    const xcodePackagePath = path.dirname(require.resolve('xcode'));
    const pbxFilePath = path.join(xcodePackagePath, 'lib', 'pbxFile');
    const pbxFile = require(pbxFilePath);
    
    proj.parseSync();
    
    const privacyManifestFilename = 'PrivacyInfo.xcprivacy';

    const parse = path.parse(path.resolve(pbxprojPath, '..'));
    const destDir = path.join(parse.dir, parse.name);

    const destPath = path.join(destDir, privacyManifestFilename);
    
    const inPbxBuildFile = searchSection(proj, 'PBXBuildFile', 'PrivacyInfo.xcprivacy in Resources');
    if (inPbxBuildFile) {
        console.log('PrivacyInfo.xcprivacy already exists');
        const inPbxFileReference = searchSection(proj, 'PBXFileReference', 'PrivacyInfo.xcprivacy');
        const destPath = path.join(destDir, inPbxFileReference.path);
        fs.copyFile(privacyManifestPath, destPath, (err) => {
            if (err) {
                console.error('override error: ', err);
                throw "Override Error";
            }
            console.log('PrivacyInfo.xcprivacy has been successfully overrided.');
        });
    } else {
        fs.copyFile(privacyManifestPath, destPath, (err) =>{
            if (err) {
                console.error('copy error: ', err);
                throw "Copy Error";
            }
            console.log('PrivacyInfo.xcprivacy has been successfully copied.');
    
            const file = new pbxFile(privacyManifestFilename, {});
            file.fileRef = proj.generateUuid();
            file.group = "Resources";
            file.uuid = proj.generateUuid();
            file.path = file.basename;
            file.lastKnownFileType = "text.xml";
            file.target = proj.findTargetKey("App"); 
        
            addToPbxBuildFileSection(proj, file);
            addToPbxFileReferenceSection(proj, file);
            addToAppPbxGroup(proj, file);
            addToPbxResourcesBuildPhase(proj, file);
        
            const text = proj.writeSync();
            fs.writeFile(pbxprojPath, text, 'utf8', (err) => {
                if (err) {
                    console.error('file write error', err);
                    throw "Write Error";
                }
                console.log('project.pbxproj has been successfully updated.');
            });
        });
    }
}


function searchSection(proj, group, name) {
    const COMMENT_KEY = /_comment$/;
    const groups = proj.hash.project.objects[group];
    for (key in groups) {
        if (!COMMENT_KEY.test(key)) continue;
        if (groups[key] === name) {
            const groupKey = key.split(COMMENT_KEY)[0];
            return groups[groupKey];
        }
    }
    return null;
}

function addToPbxBuildFileSection(proj, file) {
    const commentKey = f("%s_comment", file.uuid);
    const pbxBuildFileSection = proj.pbxBuildFileSection();
    pbxBuildFileSection[file.uuid] = {
        isa: "PBXBuildFile",
        fileRef: file.fileRef,
        fileRef_comment: file.basename
    }
    pbxBuildFileSection[commentKey] = f("%s in %s", file.basename, file.group);
}

function addToPbxFileReferenceSection(proj, file) {
    const commentKey = f("%s_comment", file.fileRef);
    const pbxFileReferenceSection = proj.pbxFileReferenceSection();
    pbxFileReferenceSection[file.fileRef] = {
        isa: "PBXFileReference",
        lastKnownFileType: "text.xml",
        path: file.path.replace(/\\/g, '/'),
        sourceTree: file.sourceTree,
    };
    pbxFileReferenceSection[commentKey] = file.basename || path.basename(file.path);
}

function addToAppPbxGroup(proj, file) {
    const appGroup = proj.pbxGroupByName('App');
    if (!appGroup) {
        proj.addPbxGroup([file.path], 'App');
    } else {
        appGroup.children.push({
            value: file.fileRef,
            comment: file.basename
        });
    }
}

function addToPbxResourcesBuildPhase(proj, file) {
    proj.addToPbxResourcesBuildPhase(file);
}

module.exports = {
    addPrivacyManifest,
    searchSection,
    addToPbxBuildFileSection,
    addToPbxFileReferenceSection,
    addToAppPbxGroup,
    addToPbxResourcesBuildPhase
};