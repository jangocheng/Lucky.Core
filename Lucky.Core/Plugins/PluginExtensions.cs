﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lucky.Core.Plugins
{
    public static class PluginExtensions
    {
        public static string GetLogoUrl(this PluginDescriptor pluginDescriptor, IWebHelper webHelper)
        {
            if (pluginDescriptor == null)
                throw new ArgumentNullException("pluginDescriptor");

            if (webHelper == null)
                throw new ArgumentNullException("webHelper");

            if (pluginDescriptor.OriginalAssemblyFile == null || pluginDescriptor.OriginalAssemblyFile.Directory == null)
            {
                return null;
            }

            var pluginDirectory = pluginDescriptor.OriginalAssemblyFile.Directory;
            var logoLocalPath = Path.Combine(pluginDirectory.FullName, "logo.jpg");
            if (!File.Exists(logoLocalPath))
            {
                return null;
            }

            string logoUrl = string.Format("{0}plugins/{1}/logo.jpg", webHelper.GetStoreLocation(), pluginDirectory.Name);
            return logoUrl;
        }
    }
}
