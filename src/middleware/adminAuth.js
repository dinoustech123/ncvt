function AdminAuth(req, res, next) {
try {
    const token = req.session.admin
    if (token) {
        next()
    } else {
        res.redirect('loginAdminData')
    }
} catch (error) {
    console.error(error)
    throw new Error
}
}


export default AdminAuth