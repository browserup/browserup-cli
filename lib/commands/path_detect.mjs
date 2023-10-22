export function isSystemDirectory(dirPath) {
    // Normalize the directory path to lower case and ensure it ends with a slash
    dirPath = dirPath.toLowerCase().replace(/\\+/g, '/');
    if (!dirPath.endsWith('/')) {
      dirPath += '/';
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
  

    const systemDirs = windowsSystemDirs.concat(linuxSystemDirs);
  
    return systemDirs.includes(dirPath);
  }
