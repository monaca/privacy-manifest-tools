const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const f = util.format;
const xcode = require('xcode');

// Usage:
// const appPath = './ios/App';
// const privacyManifestPath = './PrivacyInfo.xcprivacy';
// addPrivacyManifest(pbxprojPath, privacyManifestPath);

async function addPrivacyManifest(appPath, privacyManifestPath) {
    console.log(appPath);
    const pbxprojPath = getPbxprojPath(appPath);
    const proj = xcode.project(pbxprojPath);
        
    proj.parseSync();
    
    const privacyManifestFilename = 'PrivacyInfo.xcprivacy';
    const destDir = getDestDir(pbxprojPath);
    const destPath = path.join(destDir, privacyManifestFilename);

    const privacyManifestAlreadyExists = searchSection(proj, 'PBXBuildFile', 'PrivacyInfo.xcprivacy in Resources') != null;
    if (privacyManifestAlreadyExists) {
        console.log('PrivacyInfo.xcprivacy already exists');
        const ref = searchSection(proj, 'PBXFileReference', 'PrivacyInfo.xcprivacy');
        const destPath = path.join(destDir, ref.path);
        try {
            await fs.copyFile(privacyManifestPath, destPath);
        } catch (err) {
            console.error('override error: ', err);
            throw new Error('Override Error');
        }
        console.log('PrivacyInfo.xcprivacy has been successfully overrided.');
    } else {
        console.log('pbxprojPath:' + pbxprojPath);
        console.log('destDir:' + destDir);
        try {
            await fs.copyFile(privacyManifestPath, destPath);
            console.log('PrivacyInfo.xcprivacy has been successfully copied.');
        } catch (err) {
            if (err) {
                console.error('copy error: ', err);
                throw new Error('Copy Error');
            }
        }
        const file = createPbxFileForPrivacyInfo(proj, privacyManifestFilename);
        // PbxBuildFileセクション に PrivacyInfoを追加
        addToPbxBuildFileSection(proj, file);
        // PbxFileReferenceセクション に PrivacyInfoを追加
        addToPbxFileReferenceSection(proj, file);
        // PbxGroupセクション の Appグループの children に PrivacyInfoを追加
        addToAppPbxGroup(proj, file);
        // PbxResourcesBuildPhaseセクションの Resourcesグループの files に PrivacyInfoを追加
        addToPbxResourcesBuildPhase(proj, file);
    
        const text = proj.writeSync();
        try {
            await fs.writeFile(pbxprojPath, text, 'utf8');
        } catch (err) {
            console.error('file write error', err);
            throw new Error('Write Error');
        }
        console.log('project.pbxproj has been successfully updated.');
    }
}

function createPbxFileForPrivacyInfo(proj, privacyManifestFilename) {
    const xcodePackagePath = path.dirname(require.resolve('xcode'));
    const pbxFilePath = path.join(xcodePackagePath, 'lib', 'pbxFile');
    const pbxFile = require(pbxFilePath);

    // Generate the same structure as if you had created PrivacyManifest on Xcode.
    const file = new pbxFile(privacyManifestFilename, {});
    file.fileRef = proj.generateUuid();
    file.group = 'Resources';
    file.uuid = proj.generateUuid();
    file.path = file.basename;
    file.lastKnownFileType = 'text.xml';
    file.target = proj.findTargetKey('App'); 
    return file;
}

function getPbxprojPath(appPath) {
    const ext = path.extname(appPath);
    if (ext === '.pbxproj') {
        return appPath;
    } else if (ext === '.xcodeproj') {
        return path.join(appPath, 'project.pbxproj');
    } else {
        const base = path.basename(appPath);
        return path.join(appPath, base + '.xcodeproj', 'project.pbxproj');
    }
}

function getDestDir(pbxprojPath) {
    const parse = path.parse(path.resolve(pbxprojPath, '..'));
    const destDir = path.join(parse.dir, parse.name);
    return destDir;
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
    const commentKey = f('%s_comment', file.uuid);
    const pbxBuildFileSection = proj.pbxBuildFileSection();
    pbxBuildFileSection[file.uuid] = {
        isa: 'PBXBuildFile',
        fileRef: file.fileRef,
        fileRef_comment: file.basename
    }
    pbxBuildFileSection[commentKey] = f('%s in %s', file.basename, file.group);
}

function addToPbxFileReferenceSection(proj, file) {
    const commentKey = f('%s_comment', file.fileRef);
    const pbxFileReferenceSection = proj.pbxFileReferenceSection();
    pbxFileReferenceSection[file.fileRef] = {
        isa: 'PBXFileReference',
        lastKnownFileType: 'text.xml',
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