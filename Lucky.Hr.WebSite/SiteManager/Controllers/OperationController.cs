﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Lucky.Hr.Core;
using Lucky.Hr.Core.Specification;
using Lucky.Hr.Entity;
using Lucky.Hr.IService;
using Lucky.Hr.ViewModels;
using Lucky.Hr.ViewModels.Models.SiteManager;

namespace Lucky.Hr.SiteManager.Controllers
{
    public class OperationController : BaseAdminController
    {
        private IHrDbContext _context;
        private IOperationRepository _operationRepository;
        public OperationController(IHrDbContext context,IOperationRepository operationRepository)
        {
            _context = context;
            _operationRepository = operationRepository;
        }
        // GET: Operation
        public ActionResult Index(int pageIndex = 1, string keyword = "")
        {
            var spec = SpecificationBuilder.Create<Operation>();
            if (keyword != "")
                spec.Like(a => a.OperationName, keyword);
            var pagelist = _operationRepository.GetPaged(spec.Predicate, a => a.OperationId, pageIndex, 20);
            var models = pagelist.Select(a => { return a.ToModel(); }).ToPagedList(pageIndex, 20, pagelist.TotalCount);
            return View(models);
        }

        // GET: Operation/Details/5
        public ActionResult Details(int id)
        {
            var entity = _operationRepository.Single(a => a.OperationId == id);
            var model = entity.ToModel();
            return View(model);
        }

        // GET: Operation/Create
        public ActionResult Create()
        {
            var model = new OperationViewModel();
            return View(model);
        }

        // POST: Operation/Create
        [HttpPost]
        public ActionResult Create(OperationViewModel model)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    var entity = model.ToEntity();
                    _operationRepository.Add(entity);
                }
                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }

        // GET: Operation/Edit/5
        public ActionResult Edit(int id)
        {
            var entity = _operationRepository.Single(a => a.OperationId == id);
            var model = entity.ToModel();
            return View(model);
        }

        // POST: Operation/Edit/5
        [HttpPost]
        public ActionResult Edit(OperationViewModel model)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    var entity = model.ToEntity();
                    _operationRepository.Update(entity);
                }
                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }

        // GET: Operation/Delete/5
        public ActionResult Delete(int id)
        {
            try
            {
                _operationRepository.Delete(a => a.OperationId == id);
                var redirectUrl = new UrlHelper(Request.RequestContext).Action("Index", "Operation");
                return Json(new { Url = redirectUrl }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception)
            {
                
                throw;
            }
        }

        
    }
}
