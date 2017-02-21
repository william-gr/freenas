export class EntityUtils {

    handleError(entity: any, res: any) {

      if(res.code != 409) {
        console.log("Unknown error code", res.code);
      }

      entity.error = '';
      for(let i in res.error) {
        let field = res.error[i];
        let fc = entity.formService.findById(i, entity.conf.formModel);
        if(fc) {
          entity.components.forEach((item) => {
          if(item.model == fc) {
            item.hasErrorMessages = true;
            let errors = '';
            field.forEach((item, j) => {
              errors += item + ' ';
            });
            item.model.errorMessages = {error: errors};
            item.control.setErrors({error: 'yes'});
          }
          });
        } else {
          field.forEach((item, j) => {
            entity.error += item + '<br />';
          });
        }
      }

    }

}
