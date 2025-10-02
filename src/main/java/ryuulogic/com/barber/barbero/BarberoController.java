package ryuulogic.com.barber.barbero;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Optional;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/barbero")
public class BarberoController {
    @Autowired
    BarberoRepository barberoRepository;
    @GetMapping()
    public ResponseEntity<Iterable<Barbero>> findAll() {return ResponseEntity.ok(barberoRepository.findAll());}

    @GetMapping("/{id_barbero}")
    public ResponseEntity<Barbero> findById(@PathVariable Long id_barbero) {
        Optional<Barbero> indicadorResultadoOptional = barberoRepository.findById(id_barbero);
        if (indicadorResultadoOptional.isPresent()) {return ResponseEntity.ok(indicadorResultadoOptional.get());}
        else {return ResponseEntity.notFound().build();}
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody Barbero newBarbero, UriComponentsBuilder ucb) {
        Barbero savedBarbero = barberoRepository.save(newBarbero);
        URI uri =ucb
                .path("Barbero/{id_barbero}")
                .buildAndExpand(savedBarbero.getClass())
                .toUri();
        return ResponseEntity.created(uri).build();
    }

    @PutMapping("/{id_barbero}")
    public ResponseEntity<Void> update(@PathVariable Long id_barbero, @RequestBody Barbero barberoAct) {
        Barbero barberoAnt = barberoRepository.findById(id_barbero).get();
        if (barberoAnt != null) {
            barberoAct.setId_barbero(barberoAnt.getId_barbero());
            barberoRepository.save(barberoAct);
            return ResponseEntity.noContent().build();
        }
        else{return ResponseEntity.notFound().build();}
    }

    @DeleteMapping("/{id_barbero}")
    public ResponseEntity<Void> delete(@PathVariable Long id_barbero) {
        if (barberoRepository.findById(id_barbero).get() != null) {
            barberoRepository.deleteById(id_barbero);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
