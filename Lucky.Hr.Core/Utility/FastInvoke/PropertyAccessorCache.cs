﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Reflection;

namespace Lucky.Hr.Core.Utility.FastInvoke
{
    public class PropertyAccessorCache : FastReflectionCache<PropertyInfo, IPropertyAccessor>
    {
        protected override IPropertyAccessor Create(PropertyInfo key)
        {
            return new PropertyAccessor(key);
        }
    }
}
