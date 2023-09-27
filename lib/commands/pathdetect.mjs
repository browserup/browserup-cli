export function isSystemDirectory(dirPath) {
    // Normalize the directory path to lower case and ensure it ends with a slash
    dirPath = dirPath.toLowerCase().replace(/\\+/g, '/');
    if (!dirPath.endsWith('/')) {
      dirPath += '/';
    console.log(dirPath)
    }
  
    // Known system directories for Windows and Linux
    const windowsSystemDirs = [
      'c:/',
      'c:/windows/',
      'c:/program files/',
      'c:/program files (x86)/',
      'c:/programdata/',
      'c:/users/',
      'c:/windows/system32/',
      'c:/windows/syswow64/'
    ];
    
    const linuxSystemDirs = [
      '/',
      '/bin/',
      '/sbin/',
      '/usr/',
      '/usr/bin/',
      '/usr/sbin/',
      '/etc/',
      '/var/',
      '/var/lib/',
      '/opt/',
      '/lib/',
      '/lib64/',
      '/tmp/',
      '/boot/',
      '/home/',
      '/root/',
      '/mnt/',
      '/media/',
      '/srv/'
    ];
  
    // Combine both lists
    const systemDirs = windowsSystemDirs.concat(linuxSystemDirs);
  
    // Check if the directory path is an exact match to any known system directory
    return systemDirs.includes(dirPath);
  }
